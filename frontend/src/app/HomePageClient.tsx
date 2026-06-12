"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePageClient() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const services = [
    { title: 'General Consultation', description: 'Comprehensive medical checkups.', duration: '30 min' },
    { title: 'Dental Checkup', description: 'Professional dental examinations.', duration: '45 min' },
    { title: 'Eye Examination', description: 'Vision testing and evaluations.', duration: '30 min' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="relative bg-primary py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-primary-foreground mb-6">
            University of Ghana Student Clinic
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Your health is our priority. Access quality healthcare services.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" variant="secondary">Book Appointment</Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline">Our Services</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader></Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((s, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle>{s.title}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                  </CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">Duration: {s.duration}</p></CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}