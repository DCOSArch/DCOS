import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stethoscope, FlaskConical, ArrowRight } from 'lucide-react';
import { User } from '@/src/types';
import { mockUsers } from '@/src/mockData';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  // Assuming mockUsers[0] is the Dentist and mockUsers[1] is the Lab Admin
  const dentistUser = mockUsers.find(u => u.role === 'DENTIST') || mockUsers[0];
  const labUser = mockUsers.find(u => u.role === 'LAB_ADMIN') || mockUsers[1];

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">DentalConnect OS</h1>
          <p className="text-lg text-muted-foreground">The premier operating system for modern dentistry.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Dentist Login Card */}
          <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500/50 bg-background/60 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <Stethoscope className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">Clinical Portal</CardTitle>
              <CardDescription>For Dentists and Clinic Staff</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center py-6 text-center text-muted-foreground">
              Manage patient cases, upload intraoral scans, and collaborate seamlessly with your partner laboratories.
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 shadow-md group" 
                onClick={() => onLogin(dentistUser)}
              >
                Login as {dentistUser.name}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>

          {/* Lab Login Card */}
          <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-500/50 bg-background/60 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <FlaskConical className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">Laboratory Portal</CardTitle>
              <CardDescription>For Dental Labs and Technicians</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center py-6 text-center text-muted-foreground">
              Track production pipelines, manage materials inventory, and deliver exceptional quality restorations.
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-12 text-lg font-medium bg-emerald-600 hover:bg-emerald-700 shadow-md group"
                onClick={() => onLogin(labUser)}
              >
                Login as {labUser.name}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>For demonstration purposes, click a role to instantly login using mock credentials.</p>
        </div>
      </div>
    </div>
  );
}
