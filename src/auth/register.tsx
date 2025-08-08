import { auth } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/'); // Redirect to home after successful registration
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Register</h2>
      {error && <p style={styles.error}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        style={styles.input}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        style={styles.input}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        style={styles.input}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleRegister} style={styles.button}>
        Register
      </button>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 400,
    margin: '50px auto',
    padding: 20,
    border: '1px solid #ddd',
    borderRadius: 10,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    margin: '10px 0',
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: 10,
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    fontSize: 14,
  },
};

export default Register;
