/**
 * 邮件发送工具
 */
import nodemailer from 'nodemailer'

interface SendMailOptions {
  to: string | string[]
  subject: string
  content: string
  subtype?: 'plain' | 'html'
}

interface SendMailV2Options {
  to: string | string[]
  subject: string
  content: string
  subtype?: 'plain' | 'html'
  text?: string // 纯文本版本（用于HTML邮件的fallback）
}

function readString(name: string, fallback = '') {
  const value = process.env[name]
  return typeof value === 'string' ? value.trim() || fallback : fallback
}

function readBooleanFlag(name: string, fallback = false) {
  const raw = readString(name)
  if (!raw) return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

function readPositiveIntegerEnv(
  name: string,
  defaultValue: number,
  options: { min?: number; max?: number } = {}
) {
  const raw = readString(name)
  const value = raw ? Number(raw) : defaultValue

  if (!Number.isInteger(value) || value <= 0) {
    return defaultValue
  }

  if (typeof options.min === 'number' && value < options.min) {
    return defaultValue
  }

  if (typeof options.max === 'number' && value > options.max) {
    return defaultValue
  }

  return value
}

function getMailRuntimeConfig() {
  const host =
    readString('MAIL_SMTP_HOST_IP') ||
    readString('MAIL_SMTP_HOST');
  const port = readPositiveIntegerEnv('MAIL_SMTP_PORT', 25, { min: 1, max: 65535 });
  const secure = readBooleanFlag('MAIL_SMTP_SECURE') || port === 465;
  const ignoreTLS =
    readString('MAIL_SMTP_IGNORE_TLS') === 'false' ? false : !secure;
  const mailFrom = readString('MAIL_FROM');
  const password = readString('MAIL_PASSWORD');
  const authUser = readString('MAIL_AUTH_USER') || mailFrom;
  const authPassword = readString('MAIL_AUTH_PASSWORD') || password;
  const disableAuth = readBooleanFlag('MAIL_SMTP_DISABLE_AUTH');
  const timeoutMs = readPositiveIntegerEnv('MAIL_SMTP_TIMEOUT_MS', 8000, { min: 1000, max: 60000 });

  return {
    host,
    port,
    secure,
    ignoreTLS,
    mailFrom,
    password,
    authUser,
    authPassword,
    disableAuth,
    connectionTimeoutMs: readPositiveIntegerEnv('MAIL_SMTP_CONNECTION_TIMEOUT_MS', timeoutMs, { min: 1000, max: 60000 }),
    greetingTimeoutMs: readPositiveIntegerEnv('MAIL_SMTP_GREETING_TIMEOUT_MS', timeoutMs, { min: 1000, max: 60000 }),
    socketTimeoutMs: readPositiveIntegerEnv('MAIL_SMTP_SOCKET_TIMEOUT_MS', timeoutMs, { min: 1000, max: 60000 }),
  };
}

function getTransportOptions(config = getMailRuntimeConfig()) {
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    ignoreTLS: config.ignoreTLS,
    requireTLS: false,
    connectionTimeout: config.connectionTimeoutMs,
    greetingTimeout: config.greetingTimeoutMs,
    socketTimeout: config.socketTimeoutMs,
    tls: {
      rejectUnauthorized: false
    },
    ...(config.disableAuth
      ? {}
      : {
          auth: {
            user: config.authUser,
            pass: config.authPassword
          }
        })
  };
}

function getMailConfigError(config = getMailRuntimeConfig()) {
  if (!config.mailFrom) {
    return 'MAIL_FROM 未配置'
  }

  if (!config.host) {
    return 'MAIL_SMTP_HOST 未配置'
  }

  if (!config.disableAuth && (!config.authUser || !config.authPassword)) {
    return 'MAIL_AUTH_USER 或 MAIL_AUTH_PASSWORD 未配置'
  }

  return ''
}

function buildTransporter(config = getMailRuntimeConfig()) {
  return nodemailer.createTransport(getTransportOptions(config));
}

export function getMailDebugConfig() {
  const config = getMailRuntimeConfig();

  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    ignoreTLS: config.ignoreTLS,
    disableAuth: config.disableAuth,
    from: config.mailFrom,
    authUser: config.authUser,
    connectionTimeoutMs: config.connectionTimeoutMs,
    greetingTimeoutMs: config.greetingTimeoutMs,
    socketTimeoutMs: config.socketTimeoutMs,
    configured: !getMailConfigError(config),
  };
}

export async function verifyMailConnection() {
  const config = getMailRuntimeConfig();
  const configError = getMailConfigError(config);
  if (configError) {
    throw new Error(configError);
  }

  const transporter = buildTransporter(config);
  try {
    await transporter.verify();
    return {
      success: true,
      config: getMailDebugConfig(),
    };
  } finally {
    transporter.close();
  }
}

/**
 * 通过 SMTP 发送邮件（同 docs/邮件发送/demo.py 逻辑）
 */
export async function sendMail(options: SendMailOptions) {
  const config = getMailRuntimeConfig()
  const configError = getMailConfigError(config)
  if (configError) {
    return { success: false, message: configError, errorCode: 'MAIL_NOT_CONFIGURED' }
  }

  const transporter = buildTransporter(config)
  const { mailFrom } = config

  const mailTo = typeof options.to === 'string' ? options.to : `${options.to}`

  try {
    const info = await transporter.sendMail({
      from: mailFrom,
      to: mailTo,
      subject: options.subject,
      [options.subtype === 'html' ? 'html' : 'text']: options.content
    })

    if (info.messageId) {
      return { success: true }
    }

    return { success: false, message: '发送邮件失败，未收到 messageId' }
  } catch (error: any) {
    console.error('发送邮件失败:', error)
    return { success: false, message: error?.message || '发送邮件失败' }
  } finally {
    transporter.close()
  }
}

/**
 * 发送邮件 V2（支持HTML模板）
 */
export async function sendMailV2(options: SendMailV2Options) {
  const config = getMailRuntimeConfig()
  const configError = getMailConfigError(config)
  if (configError) {
    return { success: false, message: configError, errorCode: 'MAIL_NOT_CONFIGURED' }
  }

  const { mailFrom } = config
  const mailFromName = readString('MAIL_FROM_NAME') || readString('EMAIL_APP_NAME') || '人生K线'

  const transporter = nodemailer.createTransport({
    ...getTransportOptions(config),
    // 启用调试日志（仅在开发环境）
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  })

  const mailTo = typeof options.to === 'string' ? options.to : `${options.to}`

  try {
    // 为HTML邮件生成纯文本版本（163邮箱更喜欢有纯文本版本的邮件）
    let textContent = options.text
    if (!textContent && options.subtype === 'html') {
      // 简单地从HTML中提取文本内容
      textContent = options.content
        .replace(/<[^>]+>/g, '') // 移除HTML标签
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // 构建完整的邮件选项，添加必要的邮件头
    const mailOptions: any = {
      from: `"${mailFromName}" <${mailFrom}>`, // 格式化的发件人
      to: mailTo,
      subject: options.subject,
      // 如果提供了纯文本版本，同时发送HTML和文本版本（multipart/alternative）
      ...(options.subtype === 'html' && textContent
        ? {
            html: options.content,
            text: textContent
          }
        : {
            [options.subtype === 'html' ? 'html' : 'text']: options.content
          }),
      // 添加必要的邮件头，提高163邮箱的接收率
      headers: {
        'Message-ID': `<${Date.now()}-${Math.random().toString(36).substring(7)}@${mailFrom.split('@')[1]}>`,
        'Date': new Date().toUTCString(),
        'Reply-To': mailFrom, // 设置回复地址
        'X-Mailer': 'Nodemailer',
        'X-Priority': '3', // 普通优先级
        // 移除Content-Type头，让nodemailer自动处理multipart
        ...(options.subtype === 'html' && textContent
          ? {} // multipart时让nodemailer自动处理
          : {
              'MIME-Version': '1.0',
              'Content-Type': options.subtype === 'html' 
                ? 'text/html; charset=UTF-8' 
                : 'text/plain; charset=UTF-8',
              'Content-Transfer-Encoding': '8bit'
            })
      }
    }

    // 发送邮件
    const info = await transporter.sendMail(mailOptions)

    // 记录详细的发送信息
    const logInfo = {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
      to: mailTo,
      from: mailFrom
    }

    console.log('邮件发送详情:', JSON.stringify(logInfo, null, 2))

    // 检查是否有被拒绝的收件人
    if (info.rejected && info.rejected.length > 0) {
      console.error('部分收件人被拒绝:', info.rejected)
      return { 
        success: false, 
        message: `部分收件人被拒绝: ${info.rejected.join(', ')}`,
        rejected: info.rejected
      }
    }

    if (info.messageId) {
      return { 
        success: true, 
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted
      }
    }

    return { success: false, message: '发送邮件失败，未收到 messageId' }
  } catch (error: any) {
    console.error('发送邮件失败:', error)
    console.error('错误详情:', {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      stack: error?.stack
    })
    return { 
      success: false, 
      message: error?.message || '发送邮件失败',
      errorCode: error?.code,
      errorResponse: error?.response
    }
  } finally {
    transporter.close()
  }
}

export async function deliverMailWithRetry<T extends { success?: boolean; message?: string }>(
  operation: () => Promise<T>,
  options?: {
    retries?: number;
    delayMs?: number;
  }
) {
  const retries = options?.retries ?? 1;
  const delayMs = options?.delayMs ?? 1200;
  let lastResult = await operation();

  for (let attempt = 0; attempt < retries; attempt += 1) {
    if (lastResult?.success) {
      return lastResult;
    }

    const message = `${lastResult?.message || ''}`;
    const retryable = /(temporary authentication failure|connection lost to authentication server|econnreset|etimedout|timeout|socket hang up)/i.test(message);
    if (!retryable) {
      return lastResult;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    lastResult = await operation();
  }

  return lastResult;
}

/**
 * 发送邮箱验证码
 */
export async function sendVerificationCode(email: string, code: string, type: 'login' | 'register' | 'reset' = 'login') {
  const typeText = {
    login: '登录',
    register: '注册',
    reset: '重置密码'
  }[type] || '验证'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .verification-code {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
          text-align: center;
          border: 2px dashed #9ca3af;
        }
        .code {
          font-size: 36px;
          font-weight: bold;
          color: #7c3aed;
          letter-spacing: 8px;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
        }
        .expiry {
          color: #6b7280;
          font-size: 14px;
          margin-top: 15px;
        }
        .tips {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .tips p {
          margin: 5px 0;
          color: #92400e;
        }
        h2 {
          color: #1f2937;
          font-size: 24px;
          margin: 0 0 20px 0;
          text-align: center;
        }
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
        }
        .footer a {
          color: #7c3aed;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 邮箱验证码</h1>
        </div>
        <div class="content">
          <h2>您正在进行${typeText}操作</h2>
          <p style="text-align: center; color: #6b7280; margin-bottom: 30px;">
            您好！您的验证码如下：
          </p>
          <div class="verification-code">
            <div class="code">${code}</div>
            <div class="expiry">验证码有效期为 5 分钟</div>
          </div>
          <div class="tips">
            <p>⚠️ 安全提示：</p>
            <p>• 请勿将验证码告诉他人</p>
            <p>• 此验证码仅用于${typeText}操作</p>
            <p>• 如非本人操作，请忽略此邮件</p>
          </div>
        </div>
        <div class="footer">
          <p>这是一封自动发送的邮件，请勿直接回复。</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}">访问xxx</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMailV2({
    to: email,
    subject: `🔐 xxx- ${typeText}验证码`,
    content: html,
    subtype: 'html'
  });
}
