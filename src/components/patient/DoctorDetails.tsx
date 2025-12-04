import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI, feedbackAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, MapPin, DollarSign, Star, Calendar, Clock, Award, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctorDetails();
  }, [id]);

  const fetchDoctorDetails = async () => {
    try {
      const [doctorRes, feedbackRes] = await Promise.all([
        doctorAPI.getDoctorById(id!),
        feedbackAPI.getDoctorFeedback(id!),
      ]);
      setDoctor(doctorRes.data);
      setFeedbacks(feedbackRes.data);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Doctor not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate('/doctors')} className="mb-4">
          ← Back to Doctors
        </Button>

        {/* Doctor Profile Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {doctor.userId?.name?.charAt(0)}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {doctor.userId?.name}
                    </h1>
                    <Badge className="text-base">{doctor.specialization}</Badge>
                  </div>
                  {doctor.rating > 0 && (
                    <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <div>
                        <div className="font-bold text-lg">{doctor.rating.toFixed(1)}</div>
                        <div className="text-xs text-gray-600">
                          {doctor.totalRatings} reviews
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Award className="h-5 w-5 text-blue-600" />
                    <span>{doctor.qualification}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <span>{doctor.experience} years experience</span>
                  </div>
                  {doctor.location && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <span>{doctor.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">${doctor.consultationFee} per consultation</span>
                  </div>
                </div>

                {doctor.bio && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-600">{doctor.bio}</p>
                  </div>
                )}

                <div className="mt-6">
                  <Button
                    size="lg"
                    onClick={() => navigate(`/book-appointment/${doctor.userId._id}`)}
                    className="w-full md:w-auto"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Appointment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Schedule */}
        {doctor.availability && doctor.availability.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Availability Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {doctor.availability.map((slot: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      slot.isAvailable ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{slot.day}</div>
                    <div className="text-sm text-gray-600">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    {!slot.isAvailable && (
                      <Badge variant="secondary" className="mt-2">
                        Unavailable
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Patient Reviews ({feedbacks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedbacks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <div key={feedback._id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {feedback.patientId?.name}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < feedback.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-gray-600 text-sm">{feedback.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}