/**
 * Basic Angular component that displays a welcome message
 */
export class AppComponent {
  protected readonly title = 'My Angular App';

  /**
   * Dummy method that returns a welcome message
   * @returns {string} - The welcome message
   */
  getWelcomeMessage() {
    return 'Welcome to My Angular App!';
  }

  sendEvent() {
    return 'Event sent';
  }
}
