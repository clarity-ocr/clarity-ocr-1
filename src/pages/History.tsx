// src/pages/History.tsx

{/*import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface HistoryItem {
  id: string;
  fileName: string;
  date: string;
  result: string;
}

const History: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, 'ocrHistory'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const items: HistoryItem[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            fileName: data.fileName,
            date: new Date(data.timestamp.toDate()).toLocaleDateString(),
            result: data.result
          });
        });
        
        setHistoryItems(items);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>OCR History</h1>
        <div className="user-info">
          <span>{currentUser?.email}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading history...</div>
      ) : historyItems.length === 0 ? (
        <div className="empty-history">
          <p>No OCR history found. Upload a document to get started.</p>
        </div>
      ) : (
        <div className="history-list">
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Date</th>
                <th>Result</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.fileName}</td>
                  <td>{item.date}</td>
                  <td>{item.result.substring(0, 50)}...</td>
                  <td>
                    <button className="view-button">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default History;
*/}