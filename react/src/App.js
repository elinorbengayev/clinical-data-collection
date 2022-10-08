import './App.css';
import Header from "./components/Header";
import {withAuthenticator} from 'aws-amplify-react'
import {Storage} from 'aws-amplify'
import {Component} from "react";

// function App() {
//   return (
//     <div className="container">
//       <Header/>
//     </div>
//   );
// }
//
// export default App;

class App extends Component{
    state = {fileUrl: ''}
    componentDidMount() {
        Storage.get(url)
            .then(data => {
                this.setState({
                    fileUrl: data
                })
            })
            .catch(err => {
                console.log('error fetching image')
            })
    }
    render(){
          return (
            <div className="App" style={{ padding: '0px 0px 40px'}}>
                <img src={this.state.fileUrl}/>
            </div>
          );
    }

}
