import '@aws-amplify/ui-react/styles.css';

import Header from './components/Header';
import Footer from './components/Footer';

export default function App(props: React.PropsWithChildren) {
return (
<>

<Header />
<div className="container">{props.children}</div>
    
<Footer />
</>
)}