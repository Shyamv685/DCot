import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Clock, User, Star, Settings, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, appointmentsRes] = await Promise.all([
        doctorAPI.getDoctorByUserId(user!._id),
        doctorAPI.getMyAppointments(),
      ]);
      setDoctorProfile(profileRes.data);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;

    setIsCompleting(true);
    try {
      await appointmentAPI.completeAppointment(selectedAppointment._id, {
        notes,
        prescription,
      });
      alert('Appointment marked as completed');
      setSelectedAppointment(null);
      setNotes('');
      setPrescription('');
      fetchData();
    } catch (error) {
      alert((error as any)?.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setIsCompleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'secondary' | 'default' | 'outline' | 'destructive'> = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const todayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.appointmentDate);
    const today = new Date();
    return (
      aptDate.toDateString() === today.toDateString() &&
      apt.status === 'confirmed'
    );
  });

  const upcomingAppointments = appointments.filter(
    (apt) =>
      apt.status === 'confirmed' &&
      new Date(apt.appointmentDate) > new Date() &&
      new Date(apt.appointmentDate).toDateString() !== new Date().toDateString()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user?.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account Pending Approval
            </h2>
            <p className="text-gray-600">
              Your doctor account is currently under review. You will receive an email once your account is approved by the admin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, Dr. {user?.name}
              </h1>
              <p className="text-gray-600">Manage your appointments and profile</p>
            </div>
            <Button onClick={() => navigate('/doctor/profile')}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Profile
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {todayAppointments.length}
                </div>
                <div className="text-gray-600">Today's Appointments</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {doctorProfile?.totalAppointments || 0}
                </div>
                <div className="text-gray-600">Total Appointments</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                  <Star className="h-8 w-8 fill-yellow-600" />
                  {doctorProfile?.rating?.toFixed(1) || '0.0'}
                </div>
                <div className="text-gray-600">Rating</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {doctorProfile?.totalRatings || 0}
                </div>
                <div className="text-gray-600">Reviews</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today">
              <TabsList className="mb-4">
                <TabsTrigger value="today">
                  Today ({todayAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming">
                  Upcoming ({upcomingAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All ({appointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="space-y-4">
                {todayAppointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No appointments today
                  </p>
                ) : (
                  todayAppointments.map((appointment) => (
                    <Card key={appointment._id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">
                                {appointment.patientId?.name}
                              </h3>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {appointment.patientId?.email}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                              </div>
                              {appointment.symptoms && (
                                <div className="mt-2">
                                  <span className="font-medium">Symptoms:</span>{' '}
                                  {appointment.symptoms}
                                </div>
                              )}
                            </div>
                          </div>
                          {appointment.status === 'confirmed' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedAppointment(appointment)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Complete Appointment</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                      id="notes"
                                      placeholder="Consultation notes..."
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      rows={4}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="prescription">Prescription</Label>
                                    <Textarea
                                      id="prescription"
                                      placeholder="Prescribed medications..."
                                      value={prescription}
                                      onChange={(e) => setPrescription(e.target.value)}
                                      rows={4}
                                    />
                                  </div>
                                  <Button
                                    onClick={handleCompleteAppointment}
                                    disabled={isCompleting}
                                    className="w-full"
                                  >
                                    {isCompleting ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Completing...
                                      </>
                                    ) : (
                                      'Mark as Completed'
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
                                {appointment.patientId?.name}
                              </h3>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(appointment.appointmentDate), 'MMMM dd, yyyy')}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {appointment.patientId?.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                {appointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No appointments yet
                  </p>
                ) : (
                  appointments.map((appointment) => (
                    <Card key={appointment._id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">
                                {appointment.patientId?.name}
                              </h3>
                              {getStatusBadge(appointment.status)}
                            </div>
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