// 2683 - NoImplicitThis: 'this' implicitly has type 'any'.
function noImplicitThisTS2683() {
  console.log(this.value); // Error 2683
}

// 2531 - StrictNullChecks: Object is possibly 'null'.
const strictNullChecksTS2531: string = null;
