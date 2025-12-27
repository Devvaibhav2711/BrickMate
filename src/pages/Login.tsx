import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if already logged in
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/');
            }
        };
        checkUser();
    }, [navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Account created! You can now sign in.');
                setIsSignUp(false); // Switch back to login
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Welcome back!');
                navigate('/');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-none">
                <CardHeader className="space-y-1 text-center pb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <img src="/lovable-uploads/brick-wall.png" alt="Logo" className="w-8 h-8 opacity-80" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Bricksmate Admin</CardTitle>
                    <CardDescription>
                        {isSignUp ? 'Create an account to get started' : 'Enter your credentials to access the dashboard'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11"
                                minLength={6}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full h-11 text-base" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                                </>
                            ) : (
                                isSignUp ? 'Sign Up' : 'Sign In'
                            )}
                        </Button>
                        <Button
                            variant="link"
                            type="button"
                            className="text-sm text-muted-foreground"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
