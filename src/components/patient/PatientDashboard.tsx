import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI, feedbackAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Clock, MapPin, Star, X } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getMyAppointments();
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await appointmentAPI.cancelAppointment(appointmentId, {
        cancelReason: 'Cancelled by patient',
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedAppointment || rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await feedbackAPI.submitFeedback({
        appointmentId: selectedAppointment._id,
        rating,
        comment,
      });
      alert('Feedback submitted successfully!');
      setSelectedAppointment(null);
      setRating(0);
      setComment('');
      fetchAppointments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'confirmed' && new Date(apt.appointmentDate) >= new Date()
  );

  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'completed' || new Date(apt.appointmentDate) < new Date()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name}
          </h1>
          <p className="text-gray-600">Manage your appointments and health records</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {upcomingAppointments.length}
                </div>
                <div className="text-gray-600">Upcoming Appointments</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {pastAppointments.filter((a) => a.status === 'completed').length}
                </div>
                <div className="text-gray-600">Completed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">
                  {appointments.length}
                </div>
                <div className="text-gray-600">Total Appointments</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Appointments</CardTitle>
              <Button onClick={() => navigate('/doctors')}>
                <Calendar className="mr-2 h-4 w-4" />
                Book New Appointment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">
                  Upcoming ({upcomingAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past ({pastAppointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No upcoming appointments
                  </p>
                ) : (
                  upcomingAppointments.map((appointment) => (
                    <Card key={appointment._id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">
                                Dr. {appointment.doctorId?.name}
                              </h3>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <p className="text-gray-600 mb-2">
                              {appointment.doctorDetails?.specialization}
                            </p>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(appointment.appointmentDate), 'MMMM dd, yyyy')}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                              </div>
                              {appointment.doctorDetails?.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {appointment.doctorDetails.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelAppointment(appointment._id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastAppointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No past appointments
                  </p>
                ) : (
                  pastAppointments.map((appointment) => (
                    <Card key={appointment._id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">
                                Dr. {appointment.doctorId?.name}
                              </h3>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <p className="text-gray-600 mb-2">
                              {appointment.doctorDetails?.specialization}
                            </p>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(appointment.appointmentDate), 'MMMM dd, yyyy')}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                              </div>
                            </div>
                          </div>
                          {appointment.status === 'completed' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedAppointment(appointment)}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Rate Doctor
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rate Your Experience</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Rating</Label>
                                    <div className="flex gap-2 mt-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          onClick={() => setRating(star)}
                                          className="focus:outline-none"
                                        >
                                          <Star
                                            className={`h-8 w-8 ${
                                              star <= rating
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="comment">Comment (Optional)</Label>
                                    <Textarea
                                      id="comment"
                                      placeholder="Share your experience..."
                                      value={comment}
                                      onChange={(e) => setComment(e.target.value)}
                                      rows={4}
                                    />
                                  </div>
                                  <Button
                                    onClick={handleSubmitFeedback}
                                    disabled={isSubmitting || rating === 0}
                                    className="w-full"
                                  >
                                    {isSubmitting ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                      </>
                                    ) : (
                                      'Submit Feedback'
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}