import React, { useState,useEffect } from "react"; // Bug fix: added React import required for JSX transform - Shaun Lee Xuan Wei A0252626E
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from 'axios';
import Spinner from "../Spinner"; // Bug fix: removed unused 'import { set } from "mongoose"' — server-side import in client code causes frontend test failures - Shaun Lee Xuan Wei A0252626E

export default function PrivateRoute(){
    const [ok,setOk] = useState(false)
    const [auth,setAuth] = useAuth()

    useEffect(()=> {
        const authCheck = async() => {
            const res = await axios.get("/api/v1/auth/user-auth");
            if(res.data.ok){
                setOk(true);
            } else {
                setOk(false);
            }
        };
        if (auth?.token) authCheck();
    }, [auth?.token]);

    return ok ? <Outlet /> : <Spinner path=""/>;
}