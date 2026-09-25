import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { PaymentsService, PaymentVerification } from '../../services/payments';

type VerifyState = 'loading' | 'success' | 'failed' | 'error';

export const PaymentVerifyPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [state, setState] = useState<VerifyState>('loading');
    const [verification, setVerification] = useState<PaymentVerification | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Paystack appends ?trxref=REF&reference=REF to the callback URL
    const reference = searchParams.get('trxref') || searchParams.get('reference');

    useEffect(() => {
        if (!reference) {
            setErrorMessage('No payment reference found. You may have arrived at this page in error.');
            setState('error');
            return;
        }

        verifyPayment(reference);
    }, [reference]);

    const verifyPayment = async (ref: string) => {
        setState('loading');
        try {
            const result = await PaymentsService.verifyPayment(ref);
            setVerification(result);

            if (result.success && result.status === 'SUCCESS') {
                setState('success');
            } else if (result.status === 'PENDING') {
                // Payment is still pending — retry after a short delay
                setTimeout(() => verifyPayment(ref), 3000);
            } else {
                setErrorMessage(result.errorMessage || 'Payment was not successful.');
                setState('failed');
            }
        } catch (err) {
            console.error('Payment verification failed:', err);
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            setErrorMessage(
                error.response?.data?.message || error.message || 'Failed to verify payment. Please try again.'
            );
            setState('error');
        }
    };

    if (state === 'loading') {
        return (
            <div className="max-w-2xl mx-auto py-16 animate-fade-in">
                <div className="bg-card rounded-xl shadow-soft border p-12 text-center">
                    <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
                    <h1 className="text-2xl font-bold font-poppins mb-2">Verifying Your Payment</h1>
                    <p className="text-muted-foreground">
                        Please wait while we confirm your transaction with Paystack...
                    </p>
                </div>
            </div>
        );
    }

    if (state === 'success' && verification) {
        return (
            <div className="max-w-2xl mx-auto py-16 animate-fade-in">
                <div className="bg-card rounded-xl shadow-soft border overflow-hidden">
                    <div className="bg-success/10 p-6 border-b border-success/20">
                        <h1 className="text-3xl font-bold text-success">Payment Successful!</h1>
                    </div>

                    <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 text-success mb-4">
                            <CheckCircle className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-bold font-poppins mb-2">Booking Confirmed</h2>
                        <p className="text-muted-foreground mb-6">
                            Your payment of{' '}
                            <span className="font-semibold text-foreground">
                                {verification.currency === 'NGN' ? '₦' : verification.currency}{' '}
                                {verification.amount.toLocaleString()}
                            </span>{' '}
                            has been processed successfully.
                        </p>

                        {verification.transactionReference && (
                            <div className="bg-muted p-4 rounded-lg mb-6">
                                <p className="text-sm text-muted-foreground mb-1">Transaction Reference</p>
                                <p className="text-lg font-bold font-mono text-primary">
                                    {verification.transactionReference}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate('/bookings')}
                                className="inline-flex items-center gap-2 px-6 py-3 border rounded-lg font-semibold hover:bg-secondary transition-colors"
                            >
                                View My Bookings
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => navigate('/events')}
                                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Browse More Events
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Failed or error state
    return (
        <div className="max-w-2xl mx-auto py-16 animate-fade-in">
            <div className="bg-card rounded-xl shadow-soft border overflow-hidden">
                <div className={`p-6 border-b ${
                    state === 'failed'
                        ? 'bg-destructive/10 border-destructive/20'
                        : 'bg-warning/10 border-warning/20'
                }`}>
                    <h1 className={`text-3xl font-bold ${
                        state === 'failed' ? 'text-destructive' : 'text-warning'
                    }`}>
                        {state === 'failed' ? 'Payment Failed' : 'Verification Error'}
                    </h1>
                </div>

                <div className="p-8 text-center">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                        state === 'failed'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-warning/10 text-warning'
                    }`}>
                        {state === 'failed' ? (
                            <XCircle className="w-12 h-12" />
                        ) : (
                            <AlertTriangle className="w-12 h-12" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold font-poppins mb-2">
                        {state === 'failed' ? 'Payment Not Completed' : 'Something Went Wrong'}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        {errorMessage}
                    </p>

                    {reference && (
                        <div className="bg-muted p-3 rounded-lg mb-6">
                            <p className="text-xs text-muted-foreground">Reference: {reference}</p>
                        </div>
                    )}

                    <div className="flex gap-4 justify-center">
                        {reference && state === 'error' && (
                            <button
                                onClick={() => verifyPayment(reference)}
                                className="px-6 py-3 border rounded-lg font-semibold hover:bg-secondary transition-colors"
                            >
                                Retry Verification
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/bookings')}
                            className="px-6 py-3 border rounded-lg font-semibold hover:bg-secondary transition-colors"
                        >
                            View My Bookings
                        </button>
                        <button
                            onClick={() => navigate('/events')}
                            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Browse Events
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
