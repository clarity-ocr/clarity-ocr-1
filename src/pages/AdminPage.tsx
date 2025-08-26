import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const AdminPage: React.FC = () => {
    const [couponId, setCouponId] = useState('');
    const [percentOff, setPercentOff] = useState(25);
    const [duration, setDuration] = useState('once');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const functions = getFunctions();
        const createCouponFn = httpsCallable(functions, 'createCoupon');
        try {
            await createCouponFn({ couponId, percentOff, duration, durationInMonths: 1 });
            toast({ title: "Success!", description: `Coupon '${couponId}' created successfully.` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-2xl p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
            <Card>
                <CardHeader><CardTitle>Create Stripe Coupon</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateCoupon} className="space-y-4">
                        <div><Label htmlFor="couponId">Coupon ID (e.g., LAUNCH25)</Label><Input id="couponId" value={couponId} onChange={e => setCouponId(e.target.value.toUpperCase())} required /></div>
                        <div><Label htmlFor="percentOff">Percent Off</Label><Input id="percentOff" type="number" value={percentOff} onChange={e => setPercentOff(Number(e.target.value))} required min="1" max="100" /></div>
                        <div><Label>Duration</Label><Select value={duration} onValueChange={setDuration}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="once">Once</SelectItem><SelectItem value="repeating">Repeating (1 month)</SelectItem><SelectItem value="forever">Forever</SelectItem></SelectContent></Select></div>
                        <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : 'Create Coupon'}</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminPage;