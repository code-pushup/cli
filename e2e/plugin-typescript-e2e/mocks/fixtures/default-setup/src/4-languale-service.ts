class Standalone {
  override method() { // Error: TS4114 - 'override' modifier can only be used in a class derived from a base class.
    console.log("Standalone method");
  }
}
const s = Standalone;
