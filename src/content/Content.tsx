import React, { useState, useEffect } from 'react';

import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

import NavigationMenu from '../navigation_menu/NavigationMenu';
import EmbedContainer from './EmbedContainer'
import { useEmbedRef } from'@thoughtspot/visual-embed-sdk/react';
import { init,  AuthType, HostEvent} from '@thoughtspot/visual-embed-sdk';
import {styles} from "../util/Styles"
import NotePopup from '../popups/NotePopup';
import SpotIQPopup from '../popups/SpotIQPopUp';
import { Settings } from '../util/Types';
import { StyleOptionList, StyleOptions } from '../util/PreBuiltStyles';
import SagePopup from '../popups/SagePopup';
import { filter, flexbox } from '@chakra-ui/react';


interface ContentProps {
  settings: Settings
  showSettings: boolean
}
export default function Content(props: ContentProps) {
const {
  settings,
  showSettings
} = props
const thoughtspot_URL = "https://se-thoughtspot-cloud.thoughtspot.cloud/#/" 

const [initKey,setInitKey] = useState(0)
const [renderType, setRenderType] = useState('')
const [renderContent, setRenderContent] = useState(null)
const [renderName, setRenderName] = useState('')
const [runFilters, setRunFilters] = useState([])
const [selectedFilters, setSelectedFilters] = useState({})
const [filterKey, setFilterKey] = useState('')
const [renderKey, setRenderKey] = useState(0)
const [searchFields , setSearchFields] = useState([])
const embedRef = useEmbedRef();
const [popupVisible, setPopupVisible] = useState(false)
const [popupConfig, setPopupConfig] = useState('')
const [token,setToken]=useState('')
const [restLiveboards,setRestLiveboards] = useState({})
const [restAnswers,setRestAnswers] = useState({})
const [loggedIn,setLoggedIn] = useState(false)

function togglePopupVisible(){
  setPopupVisible(!popupVisible)
}

const defaultStyles = {
  style: {
    customCSS: {
      variables: {
        "--ts-var-button--secondary-color": settings.buttonColor ? settings.buttonColor : 'initial' ,
        "--ts-var-root-background":settings.backgroundColor ? settings.backgroundColor  : 'initial',
      }
    },
  },
}


useEffect(() => {
  console.log(settings.prebuiltStyle, StyleOptions, StyleOptions.filter((style) => style.name == settings.prebuiltStyle as StyleOptionList))
  
  if (settings.URL){
    console.log(settings.URL,settings.backgroundColor)

    let cssStyle = defaultStyles;
    let cssURL = '';
    let isURL = false;
    if (settings.prebuiltStyle != StyleOptionList.None){
      let styleOption = StyleOptions.filter((style) => style.name == settings.prebuiltStyle as StyleOptionList)[0]
      if (styleOption){
        if (styleOption.customCssUrl){
          cssURL = styleOption.customCssUrl
          isURL = true
        }else{
          cssStyle = styleOption.customizations
        }
      }
    }
    

    try {
      init({
        thoughtSpotHost: settings.URL,
        authType: AuthType.None,
        customizations: isURL ? undefined : cssStyle,
        customCssUrl: isURL ? cssURL : undefined,
        callPrefetch: true,
      });
      // logon.addListener("SDK_SUCCESS",()=>{
      //   setLoggedIn(true)
      // })
  
      // logon.addListener("SUCCESS",()=>{
      //   setLoggedIn(true)
      // })
    }
    catch(err){
      alert("Could not connect to ThoughtSpot")
    }
  }
  loadDefaultFilters();
}, [initKey])


function loadDefaultFilters(){
  var defaultFilters = {}
  if (settings.links){
    var filterObjs = []
    var defaultsFound = false;
    for (var link of settings.links){
      if (settings.linkTypes[link]=='Filter'){
        var filterContent = settings.linkContents[link].split("|")
        var filterName = settings.linkNames[link]
        if (filterContent.length>1){
          for (var i=1;i<filterContent.length;i++){
            var prop = filterContent[i].split("=")[0]
            var val  = filterContent[i].split("=")[1]
            if (prop=='default'){
              var filterObj  = {
                columnName: filterName,
                operator: 'IN',
                values: [val]
              }
              defaultFilters[filterName] = [{label:val,value:val}]
              filterObjs.push(filterObj)
              defaultsFound=true;
            }
          }
        }
      }
    }
  }
  if (defaultsFound){
    setRunFilters(filterObjs);
    setSelectedFilters(defaultFilters)
  } 
  if (!runFilters && !defaultsFound) setRunFilters([])
  if (!selectedFilters && !defaultsFound)  setSelectedFilters({})
}
function renderLink(type,content,name){
  setRenderContent(content);
  setRenderType(type);
  setRenderName(name);
  setRenderKey(Date.now())
  var newRunFilters = []
    
  //Only keep filter values if that filter exists in the new content
  for (var link of settings.links){
    if ((settings.linkTypes[link]=='Filter' || settings.linkTypes[link]=='Date Filter' || settings.linkTypes[link]=='Field') && settings.linkParents[link]==name){ 
      for (var filter of runFilters){
          if (filter.columnName == settings.linkNames[link]){
            newRunFilters.push(filter)
          }
      }
    }
  }
  setRunFilters(newRunFilters)
}


function setField(key,fields){
    // embedRef.current.trigger(HostEvent.Search, {
  //   searchQuery: buildSearchString(fields, null),
  //   executeSearch: true,

  // });
  setSearchFields({ ...searchFields, [key]: fields });
}

function setFilter(newFilterObj){
  console.log("getting filter",newFilterObj)
  var filterObjs: any[] = runFilters;
  var found = false;
  for (var i=0;i<filterObjs.length;i++){
    var filterObj:any = filterObjs[i]
    if (!filterObj) continue;
    if (filterObj.columnName == newFilterObj.columnName){
      filterObjs[i] = newFilterObj
      found = true;
    }
  }
  if (!found){
    filterObjs.push(newFilterObj)
  }
  if (renderType=='Liveboard' || renderType=='Answer'){
    embedRef.current.trigger(HostEvent.UpdateRuntimeFilters, filterObjs);
  }else{
    setRunFilters(filterObjs);
    setRenderKey(Date.now())
  }

}


var isHorizontal = (settings.orientation=='Horizontal') 



//Set primary CSS variables for page
document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
document.documentElement.style.setProperty('--secondary-color', settings.secondaryColor);

//Style filter dropdown with CSS variables
if (!isHorizontal){
  document.documentElement.style.setProperty('--rmsc-p', '8px');
  document.documentElement.style.setProperty('--rmsc-radius', '3px');
  document.documentElement.style.setProperty('--rmsc-h', '30px');
  document.documentElement.style.setProperty('--dropdown-width', '130px');
  document.documentElement.style.setProperty('--dropdown-container-right-margin', '0px');
  document.documentElement.style.setProperty('--dropdown-container-bottom-margin', '10px');
  document.documentElement.style.setProperty('--dropdown-left-margin', '130px');
  document.documentElement.style.setProperty('--dropdown-top-margin', '-240px');
  document.documentElement.style.setProperty('--dropdown-top-margin', '-240px');
  document.documentElement.style.setProperty('--dropdown-max-height', '240px');

}else{
  document.documentElement.style.setProperty('--rmsc-p', '8px');
  document.documentElement.style.setProperty('--rmsc-radius', '3px');
  document.documentElement.style.setProperty('--rmsc-h', '30px');
  document.documentElement.style.setProperty('--dropdown-width', '150px');
  document.documentElement.style.setProperty('--dropdown-container-right-margin', '10px');
  document.documentElement.style.setProperty('--dropdown-container-bottom-margin', '0px');
  document.documentElement.style.setProperty('--dropdown-left-margin', '0px');
  document.documentElement.style.setProperty('--dropdown-top-margin', '0px');
  document.documentElement.style.setProperty('--dropdown-max-height', '500px');
}

document.title = settings.name


return (
  <div style={isHorizontal ? styles.horizontalContainer : styles.verticalContainer}>
      <NavigationMenu
        url={settings.URL}
        logoImage={settings.logoImage}
        isHorizontal={isHorizontal}
        showSettings={showSettings}
        links={settings.links}
        linkNames={settings.linkNames}
        linkContents={settings.linkContents}
        linkParents={settings.linkParents}
        linkTypes={settings.linkTypes}
        setField={setField}
        setFilter={setFilter}
        selectedFilters={selectedFilters}
        renderLink={renderLink}
        renderName={renderName}
      ></NavigationMenu>
      <NotePopup></NotePopup>
      <SpotIQPopup></SpotIQPopup>
      <SagePopup worksheet={settings.sageWorksheet}></SagePopup>
    <EmbedContainer
        url={settings.URL}
        renderType={renderType}
        renderContent={renderContent}
        embedRef={embedRef}
        links={settings.links}
        searchFields={searchFields}
        runFilters={runFilters}
        isHorizontal={isHorizontal}
        renderKey={renderKey}
    >
    </EmbedContainer>
    {settings.askSage && (
    <AskSageButton settings={settings}></AskSageButton>
    )}


  </div>
)
}





function AskSageButton(props) {
  const {
    settings
  } = props
  const [showAskPrompt,setShowAskPrompt] = useState(false)
  const [sageSearch,setSageSearch] = useState('')
  function triggerSageSearch(){
      const event = new CustomEvent('sage', {detail: {data: sageSearch}});
      window.dispatchEvent(event)
      setShowAskPrompt(false)
  }
  function triggerSampleQuestion(question: string){
    const event = new CustomEvent('sage', {detail: {data: question}});
    window.dispatchEvent(event)
    setShowAskPrompt(false)
  }
  let filteredQuestions = Object.keys(settings.sageQuestions).reduce(function (filtered, key) {
    if (settings.sageQuestions[key].length > 0) filtered[key] = settings.sageQuestions[key];
      return filtered;
    }, {})
  let numSampleQuestions = Object.keys(filteredQuestions).length;
  for (var key of Object.keys(filteredQuestions)){
    if (filteredQuestions[key].length > 50){
      numSampleQuestions+=1
    }
  }
  return(
    <>
    {showAskPrompt && (
      <div className="shadow-lg bg-white flex-col p-4 space-y-2"  style={{width:'450px',height:150+30*numSampleQuestions,display:'flex',position:'absolute',bottom:'110px',right:'25px', borderWidth:2, borderRadius:'15px'}} >
      
      <div className="font-bold">Ask Your Data a Question</div>
          <div className="flex w-full h-12 bg-white border-slate-400 border rounded-2xl my-2 p-2"> 
                <input onKeyUp={(e)=>{
                    if (e.key === 'Enter' || e.keyCode === 13) {
                        triggerSageSearch();
                    }
                }} onChange={(e)=>setSageSearch(e.target.value)} value={sageSearch} placeholder="Ask AI a Data Question" 
                className="rounded-2xl w-full pl-2 bg-white border-none outline-none"></input>
                <div onClick={triggerSageSearch} className="ml-auto text-white  flex items-center bg-blue-400 hover:bg-blue-300 rounded-lg px-4 py-2 border-none">
                    {/* <HiMiniPlay className="mr-2" /> Icon next to "GO" */}
                    GO!
                </div>
            </div>
            {numSampleQuestions > 0 && (
            <div className="pt-2">
              <div className="font-bold">Or Try an Example:</div>
              <div className='flex flex-col space-y-1'>

            {Object.keys(filteredQuestions).map((questionKey)=>{
            return <div onClick={()=>{
              triggerSampleQuestion(settings.sageQuestions[questionKey]);
            }} className="text-blue-400 hover:cursor-pointer hover:text-blue-300">{settings.sageQuestions[questionKey]}</div>
            })
            }
            </div>
            </div>
            )}

  
      </div>
    )}

    <div
    onClick={()=>setShowAskPrompt(!showAskPrompt)}
    className='hover:cursor-pointer hover:shadow-lg'
    style={{padding:'5px',alignItems:'center',justifyContent:'center',textAlign:'center',width:'75px',height:'75px',display:'flex',position:'absolute',bottom:'25px',right:'25px', backgroundColor: settings.primaryColor, borderWidth:2, borderRadius:'15px'}} >
      Ask Sage
    </div>
    </>
  )

}
