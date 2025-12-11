import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import DefaultLayout from './components/DefaultLayout'
import Home from './components/Home'
import NotFound from './components/NotFound'
import ProfListaStud from './components/ProfListaStud.jsx'
import HomeLayout from './components/HomeLayout.jsx'
import Domanda from './components/Domanda.jsx'
import TaskForm from "./components/TaskForm.jsx";
import UtenteHome from './components/UtenteHome.jsx'
import {LoginForm} from './components/Login.jsx'
import API from "./API/API.mjs";



function App() {
  const [logged, setLoggedIn] = useState(false);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true); 

  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await API.getUserInfo();
        setLoggedIn(true);
        setUser(userData);
      } catch (err) {
        setLoggedIn(false);
        setUser({});
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {      
      const user = await API.login(credentials);      
      setLoggedIn(true);
      setUser(user);
      
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser({});
  };

  
 
  return (
    <>
      {loading && (
        <div className="d-flex justify-content-center align-items-center" style={{height: '100vh'}}>
          <div>Verificando sessione...</div>
        </div>
      )}
      
      {!loading && (
        <Routes>
          <Route element={<DefaultLayout isLoggedIn={logged} handleLogout={handleLogout} user={user} />}>
            <Route path="/" element={logged ? (
                user.ruolo === 'insegnante' ? <Navigate replace to="/professore" /> : 
                  <Navigate replace to="/studente" />
              ) : (
                <Home isLoggedIn={logged} />
              )
            } />

            <Route path="/professore" element={
              !logged ? <Navigate replace to="/" /> :
              user.ruolo !== 'insegnante' ? <Navigate replace to="/studente" /> :
              <HomeLayout />
            }>
              <Route index element={<UtenteHome user={user}/>} />
              <Route path="listaStudenti" element={
                !logged ? <Navigate replace to="/" /> :
                user.ruolo !== 'insegnante' ? <Navigate replace to="/studente" /> :
                <ProfListaStud user={user}/>
              } />
              <Route path="task/:id/domanda" element={
                !logged ? <Navigate replace to="/" /> :
                user.ruolo !== 'insegnante' ? <Navigate replace to="/studente" /> :
                <Domanda user={user} />
              } />
              <Route path="task/new" element={
                !logged ? <Navigate replace to="/" /> :
                user.ruolo !== 'insegnante' ? <Navigate replace to="/studente" /> :
                <TaskForm user={user} />
              } />
            </Route>

            <Route path="/studente" element={
              !logged ? <Navigate replace to="/" /> :
              user.ruolo !== 'studente' ? <Navigate replace to="/professore" /> :
              <HomeLayout user={user} />
            }>
              <Route index element={<UtenteHome user={user} />} />
              <Route path="task/:id/domanda" element={
                !logged ? <Navigate replace to="/" /> :
                user.ruolo !== 'studente' ? <Navigate replace to="/professore" /> :
                <Domanda user={user} />
              } />
            </Route>

            <Route path="/login" element={logged ? (
                user.ruolo === 'studente' ? <Navigate replace to="/studente" /> : <Navigate replace to="/professore" />
              ) : <LoginForm handleLogin={handleLogin} />} 
            />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      )}
    </>
  )
  
}

export default App
