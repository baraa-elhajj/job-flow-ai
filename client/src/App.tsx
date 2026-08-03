import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import JobDetails from "./pages/JobDetails";
import NotFound from "./pages/NotFound";
import HiddenJobs from "./pages/HiddenJobs";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home source="all" />} />
            <Route path="/linkedin" element={<Home source="linkedin" />} />
            <Route path="/hnhiring" element={<Home source="hnhiring" />} />
            <Route path="/bayt" element={<Home source="bayt" />} />
            <Route path="/hidden" element={<HiddenJobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
