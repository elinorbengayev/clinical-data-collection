import PropTypes from 'prop-types'
import Button from "./Button";

const Header = ({ title }) => {

    const onClick = () => {
        console.log('clicked')
    }

    return (
        <header className='header'>
            <h1 style={{color: 'red'}}>{title}</h1>
            <Button color='green' text ='Hello' onClick={onClick}/>
        </header>
    )
}

Header.defaultProps = {
    title: "default"
}

//to limit the type of given prop
Header.propTypes = {
    title: PropTypes.string.isRequired
}
//use inside style tag
// const headerStyle = {
//     color: 'red',
//     backgroundColor: 'black'
// }

export default Header