'use client';

;
import { motion } from 'framer-motion';
import { Mail, User, MessageSquare, AlertCircle } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AsyncSubmitButton } from '@/components/ui/EnhancedButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm, formSchemas, submitForm } from '@/lib/forms/form-handler';
import { GlassCard } from '@/components/ui/Glassmorphism';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function ContactForm({ onSuccess, className = '' }: ContactFormProps) {
  const form = useForm<ContactFormData>({
    initialValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    validationSchema: formSchemas.contact,
    onSubmit: async (values) => {
      await submitForm('/api/contact/submit', {
        ...values,
        timestamp: new Date().toISOString(),
        source: 'contact_form',
      });
    },
    onSuccess: () => {
      form.resetForm();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <GlassCard className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center space-x-2 text-2xl text-white">
            <Mail className="w-6 h-6 text-purple-400" />
            <span>Contact Us</span>
          </CardTitle>
          <p className="text-gray-300">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <form onSubmit={form.handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Full Name</span>
              </Label>
              <Input
                id="name"
                {...form.getFieldProps('name')}
                placeholder="Enter your full name"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={form.isSubmitting}
              />
              {form.fields.name?.error && form.fields.name?.touched && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription id="name-error">
                    {form.fields.name.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...form.getFieldProps('email')}
                placeholder="Enter your email address"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={form.isSubmitting}
              />
              {form.fields.email?.error && form.fields.email?.touched && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription id="email-error">
                    {form.fields.email.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Subject Field */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-white flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Subject</span>
              </Label>
              <Input
                id="subject"
                {...form.getFieldProps('subject')}
                placeholder="What's this about?"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={form.isSubmitting}
              />
              {form.fields.subject?.error && form.fields.subject?.touched && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription id="subject-error">
                    {form.fields.subject.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-white">
                Message
              </Label>
              <Textarea
                id="message"
                {...form.getFieldProps('message')}
                placeholder="Tell us more about your inquiry..."
                rows={5}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
                disabled={form.isSubmitting}
              />
              {form.fields.message?.error && form.fields.message?.touched && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription id="message-error">
                    {form.fields.message.error}
                  </AlertDescription>
                </Alert>
              )}
              <div className="text-sm text-gray-400 text-right">
                {form.values.message.length}/1000 characters
              </div>
            </div>

            {/* General Form Errors */}
            {Object.keys(form.errors).length > 0 && !form.isValid && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fix the errors above before submitting.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <AsyncSubmitButton
              onSubmit={async () => {
                if (!form.isValid) {
                  throw new Error('Please fill in all required fields correctly');
                }
                await form.handleSubmit();
              }}
              submitText="Send Message"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg"
              disabled={!form.isValid}
              touchTarget
              glowEffect
              tooltip="Send your message to our team"
              asyncOptions={{
                debounceMs: 500,
                successDuration: 3000,
                errorDuration: 4000,
                onSuccess: () => {
                  form.resetForm();
                },
                onError: (error: Error) => {
                  console.error('Contact form submission failed:', error);
                }
              }}
            />

            {/* Form Info */}
            <div className="text-sm text-gray-400 text-center">
              We'll get back to you within 24 hours. Your information is kept private and secure.
            </div>
          </form>
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

// Contact form page component
export function ContactFormPage() {
  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-300">
            Have questions about our Solidity learning platform? We're here to help!
          </p>
        </motion.div>

        <ContactForm />

        {/* Additional Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Other Ways to Reach Us</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-purple-400" />
                <span>support@soliditylearn.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <span>Live chat available 9 AM - 5 PM EST</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
