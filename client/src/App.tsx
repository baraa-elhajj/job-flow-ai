import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import JobsList from "./pages/JobsList";
// import JobDetail from "./pages/JobDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/jobs" element={<JobsList />} />
        {/* <Route path="/jobs/:id" element={<JobDetails />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
