import React from 'react'
import { getAuth,updateProfile } from 'firebase/auth'
import { updateDoc, doc, getDocs, deleteDoc, query,where,orderBy,collection } from 'firebase/firestore'
import {db} from '../firebase.config'
import { useState, useEffect } from 'react'
import { useNavigate, Link} from 'react-router-dom'
import { toast } from 'react-toastify'
import ListingItem from '../components/ListingItem'
import arrowRight from '../assets/svg/keyboardArrowRightIcon.svg'
import homeIcon from '../assets/svg/homeIcon.svg'

function Profile() {
  const auth = getAuth()
  const navigate = useNavigate()
  const [loading,setLoading] = useState(true)
  const [listings,setListings] = useState(null)

  const [changeDetails,setChangeDetails] = useState(false)

  const [formData,setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
  })

  const {name,email} = formData

  useEffect(() => {
    const fetchUserListings = async () => {
      const listingsRef = collection(db, 'listings')
      const q = query(listingsRef, where('userRef','==',auth.currentUser.uid))
      const querySnap = await getDocs(q)
 
      let listings = []

      querySnap.forEach((doc) => {
        return listings.push({
          id: doc.id,
          data: doc.data()
        })
      })

      setListings(listings)
      setLoading(false)

    }
    
    fetchUserListings()
  },[auth.currentUser.uid])

  const onLogout = () => {
    auth.signOut()
    navigate('/')
  }

  const onSubmit = async () => {
    try {
      if(auth.currentUser.displayName !== name){
        //  Update display Name In fb
        await updateProfile(auth.currentUser,{
          displayName: name
        })

        // Update Display name in firestore
        const userRef = doc(db, 'users', auth.currentUser.uid)
        await updateDoc(userRef,{
          name
        })
      }
    } catch (error) {
      console.log(error)
      toast.error('Could Not Update Profile Details')
    }
  }

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value ,
    }))
  }

  const onDelete = async (listingId) => {
    if(window.confirm('Are your sure you want to delete?')){
      await deleteDoc(doc(db,'listings',listingId))
      const updatedListings = listings.filter((listing) => listing.id !== listingId)
      setListings(updatedListings)
      toast.success('Listing Deleted')
    }
  }

  const onEdit = (listingId) => navigate(`/edit-listing/${listingId}`)

  return (
    <div className="profile">
      <header className="profileHeader">
        <p className="pageHeader">My Profile</p>
        <button type='button' className='logOut' onClick={onLogout} >
          Logout
        </button>
      </header>

      <main>
        <div className="profileDetailsHeader">
          <p className="profileDetailsText">Personal Details</p>
          <p className='changePersonalDetails' onClick={() => {
            changeDetails && onSubmit()
            setChangeDetails((prevState) => !prevState)
          }} >
            {changeDetails ? 'done' : 'change'}
          </p>
        </div>

        <div className="profileCard">
          <form>
            <input type="text" id='name' value={name} className={!changeDetails ? 'profileName' : 'profileNameActive'} disabled={!changeDetails} onChange={onChange} />
            <input type="text" id='email' value={email} className={!changeDetails ? 'profileEmail' : 'profileEmailActive'} disabled />
          </form>
        </div>

        <Link to='/create-listing' className='createListing'>
          <img src={homeIcon} alt="home" />
          <p>Sell or Rent your Home</p>
          <img src={arrowRight} alt="arrow" />
        </Link>

        {!loading && listings?.length > 0 && (
          <>
            <p className="listingText">My Listings</p>
            <ul className="categoryListings">
              {listings.map((listing) => (
                <ListingItem listing={listing.data} id={listing.id} onEdit={() => onEdit(listing.id)} onDelete={() => onDelete(listing.id)} key={listing.id} />
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  )
}

export default Profile
