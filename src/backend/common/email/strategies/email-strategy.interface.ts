export interface EmailStrategy {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}
