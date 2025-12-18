import { useState } from 'react';

const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNo, setMobileNo] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = () => {
    console.log('Login submitted', { loginEmail, loginPassword });
    // Add your login logic here
  };

  const handleRegister = () => {
    console.log('Register submitted', {
      title,
      firstName,
      lastName,
      registerEmail,
      countryCode,
      mobileNo,
      registerPassword,
      confirmPassword
    });
    // Add your register logic here
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    setShowForgotPassword(true);
  };

  const handleForgotPasswordSubmit = () => {
    console.log('Forgot password submitted', { forgotEmail });
    // Add your forgot password logic here
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
        {!showForgotPassword ? (
          <>
            {/* Tab Headers */}
            <div className="flex relative">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-6 text-center font-semibold text-lg transition-colors relative ${
                  activeTab === 'login'
                    ? 'bg-header text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-6 text-center font-semibold text-lg transition-colors relative ${
                  activeTab === 'register'
                    ? 'bg-header text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Register
              </button>
              {/* Arrow indicator */}
              <div 
                className={`absolute bottom-0 w-0 h-0 border-l-15 border-l-transparent border-r-15 border-r-transparent border-t-15 border-t-header transition-all duration-300 ${
                  activeTab === 'login' ? 'left-1/4' : 'left-3/4'
                } transform -translate-x-1/2 translate-y-full`}
              >
                
              </div>
            </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <div className="p-8 md:p-12 min-h-[500px] md:min-h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Email Address */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email Address<span className="text-header">*</span>
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Enter Password<span className="text-header">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <div className="flex justify-center mb-4 lg:mt-15">
              <button
                onClick={handleLogin}
                className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-20 rounded shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300"
              >
                LOGIN TO CONTINUE
              </button>
            </div>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-header font-medium hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Create New Account */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-header font-medium hover:underline"
              >
                Create New Account
              </button>
            </div>
          </div>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <div className="p-8 md:p-12 min-h-[500px] md:min-h-[600px]">
            <h2 className="text-xl font-semibold text-center mb-8 md:hidden">Sign Up With Malabar</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* First Name with Title */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  First Name<span className="text-header">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-3 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                  </select>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Last Name<span className="text-header">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                  required
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email Address<span className="text-header">*</span>
                </label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                  required
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Mobile No<span className="text-header">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-3 border border-gray-300 rounded focus-within:border-header">
                    <span className="text-xl mr-2">🇮🇳</span>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="focus:outline-none text-gray-700"
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+88">+88</option>
                    </select>
                  </div>
                  <input
                    type="tel"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                    required
                  />
                </div>
              </div>

              {/* Enter Password */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Enter Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
                  >
                    {showConfirmPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>
            </div>

            {/* Register Button */}
            <div className="flex justify-center mb-4 mt-8">
              <button
                onClick={handleRegister}
                className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-20 rounded shadow-lg hover:shadow-xl hover:scale-103 transition-all duration-300"
              >
                REGISTER TO CONTINUE
              </button>
            </div>

            {/* Already have account */}
            <div className="text-center">
              <span className="text-gray-600">Already have an account? </span>
              <button
                onClick={() => setActiveTab('login')}
                className="text-header font-medium hover:underline"
              >
                Log In!
              </button>
            </div>
          </div>
        )}
        </>
        ) : (
          /* Forgot Password Form */
          <div className="p-8 md:p-12 min-h-[500px]">
            <h2 className="text-2xl font-bold mb-6">Forgot Your Password?</h2>
            
            <div className="mb-6">
              <p className="text-gray-700 font-semibold mb-2">Retrieve your password here</p>
              <p className="text-gray-600 mb-2">Please enter your email address below.</p>
              <p className="text-gray-600 mb-6">You will receive a link to reset your password.</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Email Address<span className="text-header">*</span>
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full max-w-md px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                required
              />
            </div>

            <p className="text-sm text-header mb-4">* Required Fields</p>

            <div className="mb-6">
              <button
                onClick={handleBackToLogin}
                className="text-gray-700 hover:text-header font-medium"
              >
                &lt; Back to Login
              </button>
            </div>

            <div>
              <button
                onClick={handleForgotPasswordSubmit}
                className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-12 rounded shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;