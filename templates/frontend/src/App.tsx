import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {AuthProvider} from "@/contexts/AuthContext";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Auth from "@/pages/Auth.tsx";
import Register from "@/pages/Register.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <TooltipProvider>
                <Toaster/>
                <Sonner/>
                <BrowserRouter>
                    <Routes>
                        <Route path="/register" element={<Register/>}/>
                        <Route path="/auth" element={<Auth/>}/>
                        <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
                        <Route path="*" element={<NotFound/>}/>
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </AuthProvider>
    </QueryClientProvider>
);

export default App;
