// Bug fix: Removed erroneous mongoose import (server-side library, not valid in frontend) - Shaun Lee Xuan Wei A0252626E
// Bug fix: Removed unused setAuth from useAuth destructuring - Shaun Lee Xuan Wei A0252626E
// Bug fix: Missing react import
import React, { useState,useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from 'axios';
import Spinner from "../Spinner";

export default function AdminRoute(){
    const [ok,setOk] = useState(false)
    const [auth] = useAuth()

    useEffect(()=> {
        const authCheck = async() => {
            try {
                const res = await axios.get("/api/v1/auth/admin-auth");
                if(res.data.ok){
                    setOk(true);
                } else {
                    setOk(false);
                }
            } catch {
                // Bug fix: Added try-catch so network errors fall through to Spinner instead of unhandled rejection - Shaun Lee Xuan Wei A0252626E
                setOk(false);
            }
        };
        if (auth?.token) authCheck();
    }, [auth?.token]);
    
    return ok ? <Outlet /> : <Spinner/>;
}