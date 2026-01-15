import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const EmailClient = async (to: string[], subject: string, html: string): Promise<string> => {
   const { data, error } = await resend.emails.send({
      from: "Tonmame <support@mail.tonmame.store>",
      to: to,
      subject: subject,
      html: html,
   });
   if (error) {
      throw error;
   }
   return `Email sent with the id: ${data.id}`;
};
