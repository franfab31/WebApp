import { Container } from "react-bootstrap";
import { Outlet } from "react-router";
import NavHeader from "./NavHeader";

function DefaultLayout(props) {
  
  return(
    <>
      {props.isLoggedIn ? (
        <>
          <NavHeader isLoggedIn={props.isLoggedIn} handleLogout={props.handleLogout} />
          <Container fluid className="mt-3">
            <Outlet />
          </Container>
        </>
      ) : (
        <Container fluid className="mt-3">
          <Outlet />
        </Container>
      )}
    </>
  );
}

export default DefaultLayout;