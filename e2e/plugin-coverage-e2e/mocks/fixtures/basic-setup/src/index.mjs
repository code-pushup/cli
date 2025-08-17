export function untested() {
  console.log('This function is not tested');
}

export function get42() {
  return 42;
}

export function isEven(num) {
  if (num === undefined) {
    return false;
  }
  const parsedNumber = parseInt(num, 10);
  return parsedNumber % 2 === 0;
}
