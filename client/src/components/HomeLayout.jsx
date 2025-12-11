import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';

function HomeLayout() {
  return (
    <>
      
      <Container fluid>
        <Outlet />
      </Container>
    </>
  );
}

export default HomeLayout;