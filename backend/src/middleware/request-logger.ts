import type { RequestHandler } from "express";
import { env } from "../config/env";

const requestLogger: RequestHandler = (req, _res, next) => {
  if (env.isDevelopment) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.originalUrl;
    
    console.log(`\n${'▶️ '.repeat(40)}`);
    console.log(`📨 INCOMING REQUEST`);
    console.log(`${'▶️ '.repeat(40)}`);
    console.log(`⏰ ${timestamp}`);
    console.log(`📍 ${method} ${path}`);
    console.log(`🌐 IP: ${req.ip}`);
    console.log(`🖥️  User-Agent: ${req.get('user-agent') || 'N/A'}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
      // Mask sensitive fields
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '***HIDDEN***';
      if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '***HIDDEN***';
      console.log(`📦 Body:`, JSON.stringify(sanitizedBody, null, 2));
    }
    
    if (req.query && Object.keys(req.query).length > 0) {
      console.log(`🔍 Query:`, JSON.stringify(req.query, null, 2));
    }
    
    if (req.headers.authorization) {
      console.log(`🔑 Auth: Bearer ${req.headers.authorization.substring(7, 20)}...`);
    }
    
    console.log(`${'▶️ '.repeat(40)}\n`);
  }
  
  next();
};

export default requestLogger;
