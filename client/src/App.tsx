import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import JobsList from "./pages/JobsList";
import LinkedInJobsList from "./pages/LinkedInJobsList";
import JobDetails from "./pages/JobDetails";
import LinkedInJobDetails from "./pages/LinkedInJobDetails";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/jobs/linkedin" element={<LinkedInJobsList />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/jobs/linkedin/:id" element={<LinkedInJobDetails />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
