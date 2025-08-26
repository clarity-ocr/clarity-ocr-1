import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

// Define the shape of our plan objects for TypeScript
interface Plan {
    name: string;
    price: string;
    role: 'free' | 'pro' | 'business';
    features: string[];
    cta: string;
    priceId: string | null;
    disabledFeatures?: string[];
}

const PLANS: { monthly: Plan[]; yearly: Plan[] } = {
    monthly: [
        { name: 'Free', price: '$0', role: 'free', features: ['5 Analyses / month', 'Basic Export (JSON)', 'Standard OCR'], cta: 'Your Current Plan', priceId: null, disabledFeatures: ['Advanced AI Task Extraction', 'Advanced Export (PDF, CSV)', 'Public Sharing'] },
        { name: 'Pro', price: '$10', role: 'pro', features: ['100 Analyses / month', 'Advanced AI Task Extraction', 'Advanced Export (PDF, CSV)', 'Public Sharing'], cta: 'Subscribe Now', priceId: 'PRO_MONTHLY_PLACEHOLDER', disabledFeatures: ['Priority Support'] },
        { name: 'Business', price: '$25', role: 'business', features: ['Unlimited Analyses', 'Team Access (soon)', 'Advanced Export (PDF, CSV)', 'Public Sharing', 'Priority Support'], cta: 'Subscribe Now', priceId: 'BUSINESS_MONTHLY_PLACEHOLDER' }
    ],
    yearly: [
        { name: 'Free', price: '$0', role: 'free', features: ['5 Analyses / month', 'Basic Export (JSON)', 'Standard OCR'], cta: 'Your Current Plan', priceId: null, disabledFeatures: ['Advanced AI Task Extraction', 'Advanced Export (PDF, CSV)', 'Public Sharing'] },
        { name: 'Pro', price: '$8', role: 'pro', features: ['100 Analyses / month', 'Advanced AI Task Extraction', 'Advanced Export (PDF, CSV)', 'Public Sharing'], cta: 'Subscribe Now', priceId: 'PRO_YEARLY_PLACEHOLDER', disabledFeatures: ['Priority Support'] },
        { name: 'Business', price: '$20', role: 'business', features: ['Unlimited Analyses', 'Team Access (soon)', 'Advanced Export (PDF, CSV)', 'Public Sharing', 'Priority Support'], cta: 'Subscribe Now', priceId: 'BUSINESS_YEARLY_PLACEHOLDER' }
    ]
};

const PricingPage: React.FC = () => {
    const { user, simulateUserUpgrade } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState<string | null>(null);
    const [coupon, setCoupon] = useState('');
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleCheckout = (plan: Plan) => {
        // ✅ FIXED: This is the primary fix. We stop the function if the plan is free.
        if (!plan.priceId || plan.role === 'free') return;
        
        if (!user) { navigate('/login'); return; }

        if (coupon.trim().toUpperCase() !== 'TRIAL90') {
            toast({
                title: "Coupon Required for Trial",
                description: "Please enter the coupon code 'TRIAL90' to activate your 3-month trial.",
                variant: 'destructive',
            });
            return;
        }

        setLoading(plan.priceId);

        setTimeout(() => {
            if (simulateUserUpgrade) {
                // Now, TypeScript knows that `plan.role` can only be 'pro' or 'business' here.
                simulateUserUpgrade(plan.role ? 'pro' : 'business');
            }
            toast({
                title: "Trial Activated!",
                description: `You now have access to the ${plan.name} plan features for this session.`,
            });
            setLoading(null);
            navigate('/history');
        }, 1500);
    };

    const currentPlans = PLANS[billingCycle];
    const userRole = user?.stripeRole || 'free';

    return (
        <div className="container mx-auto max-w-5xl p-4 sm:p-8">
            <h1 className="text-4xl font-bold text-center mb-4">Plans & Pricing</h1>
            <p className="text-center text-lg text-muted-foreground mb-8">Start for free, and unlock more power as you grow.</p>

            <Tabs defaultValue="monthly" onValueChange={(value) => setBillingCycle(value as any)} className="w-fit mx-auto mb-12">
                <TabsList>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly (Save 20%)</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {currentPlans.map(plan => (
                    <Card key={plan.name} className={`flex flex-col ${plan.name === 'Pro' ? 'border-2 border-purple-500 shadow-xl' : ''}`}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>
                                <span className="text-4xl font-bold">{plan.price}</span>
                                <span className="text-muted-foreground">/month</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-grow">
                            <ul className="space-y-3 mb-8 flex-grow">
                                {plan.features.map(f => <li key={f} className="flex items-start"><Check className="inline-block w-4 h-4 mr-2 mt-1 text-green-500 flex-shrink-0"/><span>{f}</span></li>)}
                                {plan.disabledFeatures?.map(f => <li key={f} className="flex items-start text-muted-foreground"><X className="inline-block w-4 h-4 mr-2 mt-1 flex-shrink-0"/><span>{f}</span></li>)}
                            </ul>
                            <Button className="w-full mt-auto" 
                                onClick={() => handleCheckout(plan)} 
                                disabled={!!loading || userRole === plan.role}
                            >
                                {loading === plan.priceId ? <Loader2 className="animate-spin" /> : (userRole === plan.role ? 'Your Current Plan' : plan.cta)}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <div className="max-w-md mx-auto mt-16 text-center bg-slate-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg">Activate 3-Month Trial</h3>
                <p className="text-muted-foreground text-sm mb-4">Enter the code below to unlock a premium plan for 3 months, free of charge.</p>
                <div className="flex gap-2">
                    <Input id="coupon" placeholder="Enter code..." value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                </div>
            </div>
        </div>
    );
};

export default PricingPage;