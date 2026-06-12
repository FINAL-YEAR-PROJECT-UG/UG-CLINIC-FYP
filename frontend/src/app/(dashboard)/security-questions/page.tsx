'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const securityQuestionOptions = [
  'What was the name of your first pet?',
  'What is your mother\'s maiden name?',
  'What city were you born in?',
  'What was the name of your elementary school?',
  'What is your favorite movie?',
  'What is the name of your childhood best friend?',
  'What was your first car?',
  'What is your favorite book?',
  'What is the name of the street you grew up on?',
  'What is your favorite food?',
];

const securityQuestionSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().min(1, 'Please select a security question'),
      answer: z.string().min(2, 'Answer must be at least 2 characters'),
    })
  ).min(1, 'Please add at least one security question').max(3, 'You can add up to 3 security questions'),
});

type SecurityQuestionFormData = z.infer<typeof securityQuestionSchema>;

export default function SecurityQuestionsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<SecurityQuestionFormData>({
    resolver: zodResolver(securityQuestionSchema),
    defaultValues: {
      questions: [{ question: '', answer: '' }],
    },
  });

  const questions = watch('questions');

  const addQuestion = () => {
    if (questions.length < 3) {
      setValue('questions', [...questions, { question: '', answer: '' }]);
    }
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setValue('questions', newQuestions);
    }
  };

  const onSubmit = async (data: SecurityQuestionFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/security-questions', data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save security questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <Shield className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">Security Questions Saved</CardTitle>
              <CardDescription className="text-center">
                Your security questions have been set up successfully. You can use them to recover your account if you forget your password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 text-center">
                  Make sure to remember your answers. These will be used to verify your identity during password recovery.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setSuccess(false)} className="w-full">
                Done
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Set Up Security Questions</CardTitle>
            <CardDescription className="text-center">
              Add security questions to help recover your account if you forget your password
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {questions.map((_, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`question-${index}`}>Security Question {index + 1}</Label>
                      <Select
                        onValueChange={(value) => setValue(`questions.${index}.question`, value)}
                        defaultValue={questions[index]?.question || undefined}
                      >
                        <SelectTrigger id={`question-${index}`}>
                          <SelectValue placeholder="Select a security question" />
                        </SelectTrigger>
                        <SelectContent>
                          {securityQuestionOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.questions?.[index]?.question && (
                        <p className="text-sm text-red-500">{errors.questions[index]?.question?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`answer-${index}`}>Answer</Label>
                      <Input
                        id={`answer-${index}`}
                        placeholder="Your answer"
                        {...register(`questions.${index}.answer`)}
                        disabled={isLoading}
                      />
                      {errors.questions?.[index]?.answer && (
                        <p className="text-sm text-red-500">{errors.questions[index]?.answer?.message}</p>
                      )}
                    </div>
                  </div>
                ))}

                {questions.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestion}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Question
                  </Button>
                )}
              </div>

              {errors.questions && typeof errors.questions.message === 'string' && (
                <p className="text-sm text-red-500">{errors.questions.message}</p>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Security Questions'
                )}
              </Button>

              <p className="text-xs text-center text-gray-600">
                You can add up to 3 security questions. Make sure to choose questions with answers that are easy for you to remember but hard for others to guess.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
