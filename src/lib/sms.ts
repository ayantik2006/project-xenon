import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONENUMBER;

let twilioClient: ReturnType<typeof twilio> | null = null;

// Initialize Twilio client only if credentials are provided
if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
}

export interface SMSResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send SMS via Twilio
 * Falls back to console logging in development if Twilio is not configured
 */
export async function sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
        // Ensure phone number starts with country code
        const formattedPhone = to.startsWith('+') ? to : `+91${to}`; // Default to India (+91)

        // If Twilio is not configured, log to console (development mode)
        if (!twilioClient || !twilioPhoneNumber) {
            console.log(`[MOCK SMS] To: ${formattedPhone}`);
            console.log(`[MOCK SMS] Message: ${message}`);

            if (process.env.NODE_ENV === 'production') {
                console.error('Twilio credentials not configured in production!');
                return { success: false, error: 'SMS service not configured' };
            }

            return { success: true, messageId: 'mock-message-id' };
        }

        // Send real SMS via Twilio
        const twilioMessage = await twilioClient.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: formattedPhone,
        });

        console.log(`SMS sent successfully to ${formattedPhone}, SID: ${twilioMessage.sid}`);

        return {
            success: true,
            messageId: twilioMessage.sid
        };

    } catch (error: any) {
        console.error('Failed to send SMS:', error);
        return {
            success: false,
            error: error.message || 'Failed to send SMS'
        };
    }
}

/**
 * Send OTP via SMS
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<SMSResult> {
    const message = `Your HoardSpace verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    return sendSMS(phone, message);
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string, countryCode: string = '91'): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // If already starts with country code, return with +
    if (cleaned.startsWith(countryCode)) {
        return `+${cleaned}`;
    }

    // Add country code
    return `+${countryCode}${cleaned}`;
}
