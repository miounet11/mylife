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
 * 发送邮箱验证码（官网蓝顶栏风格 · 简/繁/英）
 */
export async function sendVerificationCode(
  email: string,
  code: string,
  type: 'login' | 'register' | 'reset' = 'login',
  options?: { locale?: string | null; language?: string | null; acceptLanguage?: string | null }
) {
  const {
    getEmailChrome,
    pickLocaleString,
    resolveEmailLocale,
  } = await import('@/lib/email-locale');
  const { renderBrandedEmail, renderInfoCard, escapeHtml } = await import('@/lib/email-layout');

  const locale = resolveEmailLocale({
    email,
    locale: options?.locale,
    language: options?.language,
    acceptLanguage: options?.acceptLanguage,
  });
  const chrome = getEmailChrome(locale);
  const appName =
    (typeof process !== 'undefined' && (process.env.MAIL_APP_NAME || process.env.NEXT_PUBLIC_APP_NAME))
    || pickLocaleString(locale, {
      'zh-CN': '人生K线',
      'zh-Hant': '人生K線',
      en: 'Life K-Line',
    });
  const baseUrl = (
    (typeof process !== 'undefined'
      && (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || process.env.API_BASE_URL))
    || 'https://www.life-kline.com'
  ).replace(/\/$/, '');

  const typeText = ({
    login: pickLocaleString(locale, { 'zh-CN': '登录', 'zh-Hant': '登入', en: 'sign-in' }),
    register: pickLocaleString(locale, { 'zh-CN': '注册', 'zh-Hant': '註冊', en: 'registration' }),
    reset: pickLocaleString(locale, { 'zh-CN': '重置密码', 'zh-Hant': '重設密碼', en: 'password reset' }),
  } as const)[type] || pickLocaleString(locale, { 'zh-CN': '验证', 'zh-Hant': '驗證', en: 'verification' });

  const title = pickLocaleString(locale, {
    'zh-CN': '邮箱验证码',
    'zh-Hant': '郵箱驗證碼',
    en: 'Email verification code',
  });
  const subject = pickLocaleString(locale, {
    'zh-CN': `${appName} · ${typeText}验证码`,
    'zh-Hant': `${appName} · ${typeText}驗證碼`,
    en: `${appName} · ${typeText} code`,
  });
  const actionLine = pickLocaleString(locale, {
    'zh-CN': `你正在进行${typeText}操作。`,
    'zh-Hant': `你正在進行${typeText}操作。`,
    en: `You are completing ${typeText}.`,
  });
  const codeOnlyFor = pickLocaleString(locale, {
    'zh-CN': `此验证码仅用于${typeText}`,
    'zh-Hant': `此驗證碼僅用於${typeText}`,
    en: `This code is only for ${typeText}`,
  });

  const bodyHtml = `
    <p style="margin:0 0 14px;color:#444950">${escapeHtml(actionLine)}</p>
    <p style="margin:0 0 10px;color:#65676b;font-size:13px">${escapeHtml(chrome.yourCodeIs)}</p>
    <div style="text-align:center;background:#e7f0ff;border:1px solid #c5d8f5;border-radius:8px;padding:22px 16px;margin:0 0 16px">
      <div style="font-size:32px;font-weight:800;letter-spacing:0.28em;color:#3b5998;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace">
        ${escapeHtml(code)}
      </div>
      <div style="margin-top:10px;font-size:12px;color:#65676b">${escapeHtml(chrome.codeExpires)}</div>
    </div>
    ${renderInfoCard({
      tone: 'amber',
      title: chrome.securityTip,
      bodyHtml: `
        <div style="font-size:13px;line-height:1.7">
          · ${escapeHtml(chrome.doNotShareCode)}<br/>
          · ${escapeHtml(codeOnlyFor)}<br/>
          · ${escapeHtml(chrome.ignoreIfNotYou)}
        </div>
      `,
    })}
  `;

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email,
    preheader: `${chrome.yourCodeIs}: ${code}`,
    title,
    bodyHtml,
    textBody: [
      actionLine,
      '',
      `${chrome.yourCodeIs}: ${code}`,
      chrome.codeExpires,
      '',
      chrome.doNotShareCode,
      codeOnlyFor,
      chrome.ignoreIfNotYou,
    ].join('\n'),
    showUnsubscribe: false,
  });

  return sendMailV2({
    to: email,
    subject,
    content: html,
    text,
    subtype: 'html',
  });
}
