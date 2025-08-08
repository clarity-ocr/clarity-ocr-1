import { auth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/'); // Redirect to home page
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
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
      <button onClick={handleLogin} style={styles.button}>
        Login
      </button>
      <p>
        Don’t have an account? <Link to="/register">Register</Link>
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
    backgroundColor: '#007bff',
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

export default Login;
