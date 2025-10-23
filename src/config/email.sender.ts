import "dotenv/config"
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailClient = async(to:string[], subject:string, html: string): Promise<void> =>{
    try {
        const { data, error } = await resend.emails.send({
            from: 'Tonmame <support@mail.tonmame.store>',
            to: to,
            subject: subject,
            html: html,
        });
        if (error) {
           console.error({ error });
           throw new Error("We couldn’t send your email right now. Please try again.")
        }
       
        console.log(`Sent successfully with the id: ${data.id}`);
        
    } catch (error) {
        if(error instanceof Error){
             console.error({ errorMessage: error.message });
             throw new Error(error.message);
        }
        console.error(String(error));
        throw new Error("Oops something went wrong, Please try again.");
    }
}
