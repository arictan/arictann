// Registers the local SushiWidget plugin. In Main.storyboard, set the view controller's class to
// MainViewController (module: App).
import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(SushiWidgetPlugin())
    }
}
