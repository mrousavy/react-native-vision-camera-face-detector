import {
  useEffect,
  useRef,
  useState
} from 'react'
import {
  StyleSheet,
  Text,
  Button,
  View
} from 'react-native'
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera'
import { useIsFocused } from '@react-navigation/core'
import { useAppState } from '@react-native-community/hooks'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import {
  Camera,
  DetectionResult
} from 'react-native-vision-camera-face-detector'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { Worklets } from 'react-native-worklets-core'

/**
 * Entry point component
 *
 * @return {JSX.Element} Component
 */
function Index(): JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <FaceDetection />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

/**
 * Face detection component
 *
 * @return {JSX.Element} Component
 */
function FaceDetection(): JSX.Element {
  const {
    hasPermission,
    requestPermission
  } = useCameraPermission()
  const [
    cameraMounted,
    setCameraMounted
  ] = useState<boolean>( false )
  const [
    cameraPaused,
    setCameraPaused
  ] = useState<boolean>( false )
  const isFocused = useIsFocused()
  const appState = useAppState()
  const isCameraActive = (
    !cameraPaused &&
    isFocused &&
    appState === 'active'
  )
  const cameraDevice = useCameraDevice( 'front' )
  //
  // vision camera ref
  //
  const camera = useRef<VisionCamera>( null )
  //
  // face rectangle position
  //
  const aFaceW = useSharedValue( 0 )
  const aFaceH = useSharedValue( 0 )
  const aFaceX = useSharedValue( 0 )
  const aFaceY = useSharedValue( 0 )
  const animatedStyle = useAnimatedStyle( () => ( {
    position: 'absolute',
    borderWidth: 4,
    borderLeftColor: 'rgb(0,255,0)',
    borderRightColor: 'rgb(0,255,0)',
    borderBottomColor: 'rgb(0,255,0)',
    borderTopColor: 'rgb(255,0,0)',
    width: withTiming( aFaceW.value, {
      duration: 100
    } ),
    height: withTiming( aFaceH.value, {
      duration: 100
    } ),
    left: withTiming( aFaceX.value, {
      duration: 100
    } ),
    top: withTiming( aFaceY.value, {
      duration: 100
    } )
  } ) )

  const handleFacesDetected = Worklets.createRunInJsFn( ( {
    faces
  }: DetectionResult ) => {
    console.log( 'faces', faces )
    // if no faces are detected we do nothing
    if ( Object.keys( faces ).length <= 0 ) return

    const { bounds } = faces[ 0 ]
    const {
      width,
      height,
      x,
      y
    } = bounds
    aFaceW.value = width
    aFaceH.value = height
    aFaceX.value = x
    aFaceY.value = y

    // only call camera methods if ref is defined
    if ( camera.current ) {
      // take photo, capture video, etc...
    }
  } )

  useEffect( () => {
    if ( hasPermission ) return
    requestPermission()
  }, [] )

  /**
   * Hanldes camera mount error event
   *
   * @param {any} error Error event
   */
  function handleCameraMountError(
    error: any
  ) {
    console.error( 'camera mount error', error )
  }

  return ( <>
    { hasPermission && cameraDevice ? <>
      { cameraMounted && <>
        <Camera
          // ignore ts error as we are importing Vision 
          // Camera types from two different sources.
          // No need to use this on a real/final app.
          // @ts-ignore
          ref={ camera }
          style={ StyleSheet.absoluteFill }
          isActive={ isCameraActive }
          device={ cameraDevice }
          onError={ handleCameraMountError }
          faceDetectionCallback={ handleFacesDetected }
          faceDetectionOptions={ {
            performanceMode: 'fast',
            classificationMode: 'all'
          } }
        />

        <Animated.View
          style={ animatedStyle }
        />

        { cameraPaused && <Text
          style={ {
            backgroundColor: 'rgb(0,0,255)',
            color: 'white',
            position: 'absolute',
            bottom: 300,
            left: 0,
            right: 0
          } }
        >
          Camera is PAUSED
        </Text> }
      </> }

      { !cameraMounted && <Text
        style={ {
          backgroundColor: 'rgb(255,255,0)',
          position: 'absolute',
          bottom: 300,
          left: 0,
          right: 0
        } }
      >
        Camera is NOT mounted
      </Text> }
    </> : <Text
      style={ {
        backgroundColor: 'rgb(255,0,0)',
        color: 'white'
      } }
    >
      No camera device or permission
    </Text> }

    <View
      style={ {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0
      } }
    >
      <Button
        onPress={ () => setCameraPaused( ( current ) => !current ) }
        title={ `${ cameraPaused ? 'Resume' : 'Pause' } Camera` }
      />
      <Button
        onPress={ () => setCameraMounted( ( current ) => !current ) }
        title={ `${ cameraMounted ? 'Unmount' : 'Mount' } Camera` }
      />
    </View>
  </> )
}

export default Index
