import '@aws-amplify/ui-react/styles.css';

import Header from './components/Header';
import Footer from './components/Footer';
import ConfigureAmplifyClientSide from './ConfigureAmplify';



export default function App(props: React.PropsWithChildren) {
return (
<>
<ConfigureAmplifyClientSide />
<Header />
<div className="container">{props.children}</div>
    
<Footer />
</>
)}