import { Link } from "react-router";
import '../styles/Home.css';

function Home(props) {
  
  return (
    
    <div id="homepage">
      
      <div className="gradient-bg"></div>
      
      
      
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">Gestione Compiti</h1>
          <p className="hero-subtitle">La piattaforma digitale per studenti e professori</p>
          
          <div className="cta-buttons">
            <Link to="/login" className="btn-primary">
              <span className="btn-icon">🚀</span>
              Accedi Ora
            </Link>
          </div>
        </div>
        
        <div className="feature-cards">
          <div className="feature-card">
            <div className="card-icon">👨‍🎓</div>
            <h3>Per Studenti</h3>
            <p>Gestisci i tuoi compiti facilmente</p>
          </div>
          <div className="feature-card">
            <div className="card-icon">👨‍🏫</div>
            <h3>Per Professori</h3>
            <p>Assegna e monitora i progressi</p>
          </div>
          <div className="feature-card">
            <div className="card-icon">📊</div>
            <h3>Analytics</h3>
            <p>Statistiche degli studenti</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;