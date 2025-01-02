// 2683 - NoImplicitThis: 'this' implicitly has type 'any'.
function noImplicitThisTS2683() {
  console.log(this.value); // Error 2683
}
