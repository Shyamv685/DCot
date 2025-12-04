import { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, UserCheck, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes, usersRes, appointmentsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPendingDoctors(),
        adminAPI.getAllUsers(),
        adminAPI.getAllAppointments(),
      ]);
      setStats(statsRes.data);
      setPendingDoctors(pendingRes.data);
      setUsers(usersRes.data);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDoctor = async (userId: string) => {
    if (!confirm('Approve this doctor account?')) return;

    try {
      await adminAPI.approveDoctor(userId);
      alert('Doctor approved successfully!');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve doctor');
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    const action = isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      if (isActive) {
        await adminAPI.deactivateUser(userId);
      } else {
        await adminAPI.activateUser(userId);
      }
      alert(`User ${action}d successfully!`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await adminAPI.deleteUser(userId);
      alert('User deleted successfully!');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, doctors, and appointments</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.totalPatients || 0}
                </div>
                <div className="text-gray-600">Patients</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.totalDoctors || 0}
                </div>
                <div className="text-gray-600">Approved Doctors</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.totalAppointments || 0}
                </div>
                <div className="text-gray-600">Total Appointments</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.pendingDoctors || 0}
                </div>
                <div className="text-gray-600">Pending Approvals</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>System Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pending Doctors ({pendingDoctors.length})
                </TabsTrigger>
                <TabsTrigger value="users">
                  All Users ({users.length})
                </TabsTrigger>
                <TabsTrigger value="appointments">
                  Appointments ({appointments.length})
                </TabsTrigger>
              </TabsList>

              {/* Pending Doctors */}
              <TabsContent value="pending" className="space-y-4">
                {pendingDoctors.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No pending doctor approvals
                  </p>
                ) : (
                  pendingDoctors.map((doctor) => (
                    <Card key={doctor._id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {doctor.name}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>Email: {doctor.email}</p>
                              <p>Phone: {doctor.phone || 'N/A'}</p>
                              {doctor.doctorProfile && (
                                <>
                                  <p>
                                    Specialization: {doctor.doctorProfile.specialization}
                                  </p>
                                  <p>
                                    Qualification: {doctor.doctorProfile.qualification}
                                  </p>
                                  <p>Experience: {doctor.doctorProfile.experience} years</p>
                                  <p>Fee: ${doctor.doctorProfile.consultationFee}</p>
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleApproveDoctor(doctor._id)}
                            size="sm"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* All Users */}
              <TabsContent value="users" className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No users found</p>
                ) : (
                  users.map((user) => (
                    <Card key={user._id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {user.name}
                              </h3>
                              <Badge>{user.role}</Badge>
                              {!user.isActive && (
                                <Badge variant="destructive">Inactive</Badge>
                              )}
                              {user.role === 'doctor' && !user.isApproved && (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>Email: {user.email}</p>
                              <p>Phone: {user.phone || 'N/A'}</p>
                              <p>
                                Registered: {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          {user.role !== 'admin' && (
                            <div className="flex gap-2">
                              <Button
                                variant={user.isActive ? 'outline' : 'default'}
                                size="sm"
                                onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(user._id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Appointments */}
              <TabsContent value="appointments" className="space-y-4">
                {appointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No appointments found</p>
                ) : (
                  appointments.slice(0, 20).map((appointment) => (
                    <Card key={appointment._id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {appointment.patientId?.name} → Dr.{' '}
                                {appointment.doctorId?.name}
                              </h3>
                              <Badge
                                variant={
                                  appointment.status === 'confirmed'
                                    ? 'default'
                                    : appointment.status === 'completed'
                                    ? 'outline'
                                    : 'secondary'
                                }
                              >
                                {appointment.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>
                                Date:{' '}
                                {format(
                                  new Date(appointment.appointmentDate),
                                  'MMMM dd, yyyy'
                                )}
                              </p>
                              <p>
                                Time: {appointment.timeSlot.startTime} -{' '}
                                {appointment.timeSlot.endTime}
                              </p>
                              {appointment.symptoms && (
                                <p>Symptoms: {appointment.symptoms}</p>
                              )}
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