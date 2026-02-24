const { Lunar } = require('lunar-javascript');
const lunar = Lunar.fromYmd(1990, 1, 1);
console.log(lunar.year);
console.log(lunar.getYear());
console.log(lunar.getYearInGanZhi());
