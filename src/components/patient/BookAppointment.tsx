import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchDoctorDetails = async () => {
    try {
      const response = await doctorAPI.getDoctorByUserId(doctorId!);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      setError('Failed to load doctor details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await appointmentAPI.getAvailableSlots(doctorId!, dateStr);
      setAvailableSlots(response.data.availableSlots || []);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please select a date and time slot');
      return;
    }

    setIsBooking(true);
    setError('');

    try {
      await appointmentAPI.bookAppointment({
        doctorId,
        appointmentDate: selectedDate.toISOString(),
        timeSlot: {
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        },
        symptoms,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
            <p className="text-gray-600 mb-4">
              Your appointment has been confirmed. You will receive an email confirmation shortly.
            </p>
            <Button onClick={() => navigate('/patient/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          ← Back
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Book Appointment</h1>

        {doctor && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {doctor.userId?.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {doctor.userId?.name}
                  </h2>
                  <p className="text-gray-600">{doctor.specialization}</p>
                  <p className="text-sm text-gray-500">
                    ${doctor.consultationFee} consultation fee
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Time Slot Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Select Time Slot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <p className="text-gray-500 text-center py-8">
                  Please select a date first
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No available slots for this date
                </p>
              ) : (
                <div className="space-y-2">
                  {availableSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={selectedSlot === slot ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedSlot(slot)}
                      disabled={slot.isBooked}
                    >
                      {slot.startTime} - {slot.endTime}
                      {slot.isBooked && (
                        <Badge variant="secondary" className="ml-auto">
                          Booked
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Symptoms */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Symptoms (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="symptoms">Describe your symptoms or reason for visit</Label>
            <Textarea
              id="symptoms"
              placeholder="E.g., Fever, headache, cough..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Booking Summary */}
        {selectedDate && selectedSlot && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor:</span>
                <span className="font-semibold">{doctor?.userId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold">
                  {format(selectedDate, 'MMMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold">
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Consultation Fee:</span>
                <span className="font-semibold">${doctor?.consultationFee}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Book Button */}
        <div className="mt-6">
          <Button
            size="lg"
            className="w-full"
            onClick={handleBookAppointment}
            disabled={!selectedDate || !selectedSlot || isBooking}
          >
            {isBooking ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}