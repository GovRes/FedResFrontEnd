"use client"
// import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
// import outputs from "../amplify_outputs.json";
import Header from './components/Header';
import Footer from './components/Footer';

// Amplify.configure(outputs, {ssr: true});

export default function App(props: React.PropsWithChildren) {
return (
<>
<Header />
<div className="container">{props.children}</div>
    
<Footer />
</>
)}