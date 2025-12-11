import { useEffect, useState } from 'react';
import { Button, Container, Navbar } from 'react-bootstrap';
import { Link } from "react-router";
import API from '../API/API.mjs';

function NavHeader(props) {
  const [user, setUser] = useState({});

  useEffect(() => {
    
    const fetchUser = async () => {
      try {
        const userData = await API.getUserInfo();
        setUser(userData);
      } catch (error) {
        return(error);
      }
    };
    fetchUser();
  }, [props.isLoggedIn]);

  


  return(
    <Navbar bg='primary' data-bs-theme='dark'>
      <Container fluid>
        <Link to="/" className="navbar-brand">MyHomeWork</Link>
        
        <div className="d-flex gap-2">
          {user.ruolo === 'insegnante' && (
            <>
              <Link to='/' className='btn btn-outline-light'>Dashboard Prof</Link>
              <Link to='/professore/listaStudenti' className='btn btn-outline-light'>Lista Studenti</Link>
                </>
              )}
              
              
              {user.ruolo === 'studente' && (
                <Link to='/' className='btn btn-outline-light'>Dashboard</Link>
              )}
              
              
              <Button 
                variant='outline-light' 
                onClick={props.handleLogout}
              >
                Logout
              </Button>
          
        </div>
      </Container>
    </Navbar>
  );
}

export default NavHeader;