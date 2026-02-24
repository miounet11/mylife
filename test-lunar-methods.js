const { Lunar } = require('lunar-javascript');
const lunar = Lunar.fromYmd(1990, 1, 1);
console.log(lunar.getYear(), lunar.getMonth(), lunar.getDay());
console.log(lunar.getYearGan(), lunar.getYearZhi());
console.log(lunar.getMonthGan(), lunar.getMonthZhi());
console.log(lunar.getDayGan(), lunar.getDayZhi());
console.log(lunar.getTimeGan(), lunar.getTimeZhi()); // needs time?
