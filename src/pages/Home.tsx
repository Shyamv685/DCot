import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Users, Shield, Clock, Stethoscope, Heart, Activity } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Your Health, <span className="text-blue-600">Our Priority</span>
            </h1>
            <p className="text-xl text-gray-600">
              Book appointments with top doctors, manage your health records, and get quality healthcare from the comfort of your home.
            </p>
            <div className="flex gap-4">
              {user ? (
                <Link to={user.role === 'patient' ? '/doctors' : '/doctor/dashboard'}>
                  <Button size="lg" className="text-lg px-8">
                    {user.role === 'patient' ? 'Find Doctors' : 'Go to Dashboard'}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="text-lg px-8">Get Started</Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="text-lg px-8">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 shadow-2xl">
              <Stethoscope className="h-64 w-64 text-white mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
          <p className="text-xl text-gray-600">Experience healthcare like never before</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
              <p className="text-gray-600">Book appointments with just a few clicks</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Doctors</h3>
              <p className="text-gray-600">Access to qualified and experienced doctors</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your health data is safe and confidential</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to better health</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Search Doctors</h3>
              <p className="text-gray-600">Find doctors by specialization, location, or availability</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Book Appointment</h3>
              <p className="text-gray-600">Choose your preferred time slot and book instantly</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Treatment</h3>
              <p className="text-gray-600">Visit the doctor and receive quality healthcare</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Heart className="h-12 w-12 mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Qualified Doctors</div>
            </div>
            <div>
              <Activity className="h-12 w-12 mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2">10k+</div>
              <div className="text-blue-100">Happy Patients</div>
            </div>
            <div>
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2">50k+</div>
              <div className="text-blue-100">Appointments</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of patients who trust us with their health
          </p>
          {!user && (
            <Link to="/register">
              <Button size="lg" className="text-lg px-12">
                Create Free Account
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}