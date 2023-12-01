import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, ElementRef, EventEmitter, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { delay, switchMap, tap } from 'rxjs/operators';
import * as _ from 'lodash';

import { Breadcrumb } from 'src/app/utils/interfaces/breadcrumb';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';
import { environment } from 'src/environments/environment';
import { B2bFlowService } from './b2b-flow.service';

@Component({
  selector: 'odp-b2b-flows-manage',
  templateUrl: './b2b-flows-manage.component.html',
  styleUrls: ['./b2b-flows-manage.component.scss'],
  providers: [B2bFlowService]
})
export class B2bFlowsManageComponent implements OnInit, OnDestroy {

  @ViewChild('pageChangeModalTemplate', { static: false }) pageChangeModalTemplate: TemplateRef<HTMLElement>;
  @ViewChild('keyValModalTemplate', { static: false }) keyValModalTemplate: TemplateRef<HTMLElement>;
  pageChangeModalTemplateRef: NgbModalRef;
  keyValModalTemplateRef: NgbModalRef;
  edit: any;
  subscriptions: any;
  apiCalls: any;
  oldData: any;
  headerData: any;
  flowData: any;
  breadcrumbPaths: Array<Breadcrumb>;
  content: any;
  selectedEditorTheme: string;
  selectedFontSize: number;
  showCodeEditor: boolean;
  showConsole: boolean;
  loadingLogs: boolean;
  logs: Array<any>;
  showNewNodeDropdown: boolean;
  newNodeDropdownPos: any;
  selectedNode: any;
  showNodeProperties: boolean;
  openDeleteModal: EventEmitter<any>;
  nodeList: Array<any>;
  changesDone: boolean = false;
  saved: boolean = false

  contextMenuStyle: any;
  isMouseDown: any;

  showPathProperties: boolean;
  selectedPath: any;
  processNodeList: any = [];

  activeTab: number;
  innerTab: number = 0;
  data: any;
  nodeOptions: Array<any> = [];
  openIssues: boolean = false;
  constructor(private commonService: CommonService,
    private appService: AppService,
    private route: ActivatedRoute,
    private router: Router,
    private ele: ElementRef,
    private ts: ToastrService,
    private flowService: B2bFlowService) {
    this.subscriptions = {};
    this.edit = {
      status: false,
      id: null,
      editClicked: false
    };
    this.breadcrumbPaths = [{
      active: false,
      label: 'Data Pipes',
      url: '/app/' + this.commonService.app._id + '/flow'
    }];
    this.apiCalls = {};
    this.flowData = {};
    this.selectedEditorTheme = 'vs-light';
    this.selectedFontSize = 14;
    this.ele.nativeElement.classList.add('h-100');
    this.logs = [];
    this.openDeleteModal = new EventEmitter();
    this.nodeList = [];
    this.activeTab = 0;
  }

  ngOnInit(): void {
    this.nodeOptions = this.flowService.getNodeOptions();
    this.flowService.showAddNodeDropdown.pipe(
      tap(() => {
        this.resetSelection();
      }),
      delay(5)
    ).subscribe((data: any) => {
      this.selectedNode = data;
      this.newNodeDropdownPos = data.position;
      this.showNewNodeDropdown = true;
    });
    this.flowService.selectedNode.pipe(
      tap(() => {
        this.resetSelection();
      }),
      delay(5)
    ).subscribe((data: any) => {
      this.selectedNode = data;
      if (data) {
        this.openIssues = false
        this.showNodeProperties = true;
      } else {
        this.showNodeProperties = false;
      }
    });
    this.flowService.selectedPath.pipe(
      tap(() => {
        this.resetSelection();
      }),
      delay(5)
    ).subscribe((data: any) => {
      this.selectedPath = data;
      if (data) {
        this.openIssues = false
        this.showPathProperties = true;
      } else {
        this.showPathProperties = false;
      }
    });
    this.flowService.deleteNode.subscribe((data: any) => {
      this.openDeleteModal.emit({
        title: 'Delete Node?',
        message: 'Are you sure you want to delete this node?, You will have to re-configure flow.',
        data
      })
    });
    this.route.params.subscribe(params => {
      if (params && params.id) {
        this.edit.id = params.id;
        if (this.appService.edit) {
          this.edit.editClicked = true;
          this.appService.edit = null;
          this.edit.status = true;
        }
        this.getFlow(params.id, this.edit.status);
      } else {
        this.edit.status = true;
      }
    });
    this.saved = false
  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach(key => {
      if (this.subscriptions[key]) {
        this.subscriptions[key].unsubscribe();
      }
    });
    if (this.pageChangeModalTemplateRef) {
      this.pageChangeModalTemplateRef.close(false);
    }
  }

  getProcessNodes() {
    this.nodeList = [];
    return this.commonService.get('config', `/${this.commonService.app._id}/processnode/utils/count`).pipe(switchMap((count: any) => {
      return this.commonService.get('config', `/${this.commonService.app._id}/processnode`, {
        count: count,
      });
    })).subscribe((res: any) => {

      // res.forEach(item => {
      //   item.url = 'https://' + this.commonService.userDetails.fqdn + `/b2b/pipes/${this.app}` + item.inputNode.options.path;
      //   // this.flowList.push(item);
      // });
      this.processNodeList = res;
      // this.nodeList.forEach(e => {
      //   if (e.status == 'Pending') {
      //     this.commonService.updateStatus(e._id, 'node');
      //   }
      // })
    }, err => {

      console.log(err);
      this.commonService.errorToast(err);
    });
  }

  resetSelection() {
    this.showNewNodeDropdown = false;
    this.showNodeProperties = false;
    this.selectedNode = null;
    this.newNodeDropdownPos = null;
    this.showPathProperties = false;
    this.selectedPath = null;
  }

  getFlow(id: string, draft?: boolean) {
    this.apiCalls.getFlow = true;
    let path = `/${this.commonService.app._id}/flow/${id}`;
    if (draft) {
      path += '?draft=true';
    }
    this.showCodeEditor = false;
    this.subscriptions['getFlow'] = this.commonService.get('partnerManager', path).subscribe(res => {
      this.breadcrumbPaths.push({
        active: true,
        label: res.name + ' (Edit)'
      });
      this.commonService.changeBreadcrumb(this.breadcrumbPaths);
      this.apiCalls.getFlow = false;
      this.showCodeEditor = true;
      if (res.inputNode.dataStructure && res.inputNode.dataStructure.outgoing) {
        this.patchDataStructure(res.inputNode.dataStructure.outgoing, res.dataStructures);
      }
      if (res.errorNode && !_.isEmpty(res.errorNode)) {
        res.errorNode.dataStructure = {};
        res.errorNode.dataStructure.outgoing = this.flowService.getErrorODS();
      }

      // if (!res.errorNode || _.isEmpty(res.errorNode)) {
      //   let errorNode = this.flowService.getNodeObject('ERROR', this.nodeList);
      //   errorNode.coordinates = {
      //     x: 400,
      //     y: 30
      //   };
      //   res.errorNode = errorNode;
      // }
      res.nodes.forEach(item => {
        if (item.dataStructure && item.dataStructure.outgoing) {
          this.patchDataStructure(item.dataStructure.outgoing, res.dataStructures);
        }
        if (item.dataStructure && item.dataStructure.incoming) {
          this.patchDataStructure(item.dataStructure.incoming, res.dataStructures);
        }
        if (item.type == 'DATASERVICE') {
          this.patchDataStructure(item.options.dataService, res.dataStructures);
        }
      });
      this.flowData = this.appService.cloneObject(res);
      delete this.flowData.__v;
      delete this.flowData._metadata;
      this.oldData = this.appService.cloneObject(this.flowData);
      // this.appService.updateCodeEditorState.emit(this.edit);
      this.nodeList = [];
      if (this.flowData.inputNode) {
        this.nodeList.push(this.flowData.inputNode);
      }
      if (this.flowData.nodes) {
        this.flowData.nodes.forEach(item => {
          this.nodeList.push(item);
        });
      }
      this.getCategories()
      if (this.flowData.errorNode) {
        this.nodeList.push(this.flowData.errorNode);
      }
      this.nodeList.forEach((node, i) => {
        if (!node.name) {
          node.name = this.appService.toSnakeCase(this.flowService.getNodeType(node, i == 0));
        }
        if (!node.coordinates || !node.coordinates.x || !node.coordinates.y) {
          node.coordinates = {
            x: 20 + (i * 120),
            y: 20 + (i * 72)
          };
        }
        node.coordinates.x = Math.floor(node.coordinates.x / 20) * 20;
        node.coordinates.y = Math.floor(node.coordinates.y / 20) * 20;
      });
      this.flowService.cleanPayload(this.nodeList);
      this.flowService.nodeList = this.nodeList;
      // if (!environment.production) {
      //   setTimeout(() => {
      //     this.enableEditing()
      //   }, 1000);
      // }
    }, err => {
      this.apiCalls.getFlow = false;
      this.commonService.errorToast(err);
    });
  }

  getCategories() {
    const connectorIds = this.nodeList
      .filter(node => node.type === 'CONNECTOR' && !node.options.connectorType)
      .map(node => node.options?.connector?._id || '');

    if (connectorIds.length > 0) {
      this.commonService.get('user', `/${this.commonService.app._id}/connector`, {
        filter: {
          _id: {
            $in: connectorIds
          }
        },
        select: 'category'
      }).subscribe(res => {
        this.nodeList.forEach(item => {
          if (item.options && item.options.connector) {
            item.options.connectorType = res.find(e => e._id === item.options.connector._id)?.category;
          }
        })
      });
    }
  }

  patchDataStructure(format: any, dataStructure: any) {
    if (format && dataStructure && dataStructure[format._id]) {
      _.assign(format, dataStructure[format._id]);
    }
  }

  discardDraft() {
    const isNew = !this.flowData.hasOwnProperty('draftVersion');
    const path = isNew ? `/${this.commonService.app._id}/flow/${this.edit.id}` : `/${this.commonService.app._id}/flow/utils/${this.edit.id}/draftDelete`;
    this.apiCalls.discardDraft = true;
    const call = isNew ? this.commonService.delete('partnerManager', path, {}) : this.commonService.put('partnerManager', path, {});
    this.subscriptions['discardDraft'] = call.subscribe(res => {
      this.apiCalls.discardDraft = false;
      this.ts.success('Draft Deleted.');
      if (isNew) {
        this.router.navigate(['/app', this.commonService.app._id, 'flow']);
      }
      else {
        this.getFlow(this.flowData._id);
      }

    }, err => {
      this.apiCalls.discardDraft = false;
      this.commonService.errorToast(err);
    });
  }

  enableEditing() {
    this.edit.status = true;
    if (this.flowData.draftVersion) {
      this.getFlow(this.flowData._id, true);
    } else {
      this.appService.updateCodeEditorState.emit(this.edit);
    }
  }

  getPayload() {
    const dataStructures = {};
    this.flowData.app = this.commonService.app._id;
    const tempNodeList = JSON.parse(JSON.stringify(this.nodeList));
    this.flowService.cleanPayload(tempNodeList);
    tempNodeList.forEach(item => {
      if (item.dataStructure && item.dataStructure.outgoing && item.dataStructure.outgoing._id) {
        dataStructures[item.dataStructure.outgoing._id] = JSON.parse(JSON.stringify(item.dataStructure.outgoing));
        item.dataStructure.outgoing = {
          _id: item.dataStructure.outgoing._id,
          name: item.dataStructure.outgoing.name
        };
      }
      if (item.dataStructure && item.dataStructure.incoming && item.dataStructure.incoming._id) {
        dataStructures[item.dataStructure.incoming._id] = JSON.parse(JSON.stringify(item.dataStructure.incoming));
        item.dataStructure.incoming = {
          _id: item.dataStructure.incoming._id,
          name: item.dataStructure.incoming.name
        };
      }
      if (item.type === 'DATASERVICE' && item.options && item.options.dataService && item.options.dataService._id) {
        dataStructures[item.options.dataService._id] = JSON.parse(JSON.stringify(item.options.dataService));
        item.options.dataService = {
          _id: item.options.dataService._id,
          name: item.options.dataService.name
        };
      }
      if (item.type === 'FAAS' && item.options && item.options.faas && item.options.faas._id) {
        item.options.faas = {
          _id: item.options.faas._id,
          name: item.options.faas.name
        };
      }
    });
    this.flowData.inputNode = tempNodeList[0];
    tempNodeList.splice(0, 1);
    let errorIndex = tempNodeList.findIndex(e => e.type == 'ERROR');
    if (errorIndex > -1) {
      this.flowData.errorNode = tempNodeList[errorIndex];
      tempNodeList.splice(errorIndex, 1);
    }
    this.flowData.nodes = tempNodeList;
    this.flowData.dataStructures = dataStructures;
    if (!environment.production) {
      console.log(this.flowData);
    }
    return this.flowData;
  }

  saveDummyCode(deploy?: boolean) {
    const payload = this.getPayload();
    let request;
    this.apiCalls.save = true;
    this.saved = true
    if (deploy) {
      this.flowData.status = 'RUNNING';
    }
    if (this.edit.id) {
      request = this.commonService.put('partnerManager', `/${this.commonService.app._id}/${'flow'}/${this.edit.id}`, payload);
    } else {
      request = this.commonService.post('partnerManager', `/${this.commonService.app._id}/${'flow'}`, payload);
    }
    this.subscriptions['save'] = request.subscribe((res: any) => {
      this.apiCalls.save = false;
      this.edit.status = false;
      if (deploy) {
        this.apiCalls.deploy = false;
        this.ts.success('Saved ' + payload.name + ' and deployment process has started.');
        this.router.navigate(['/app', this.commonService.app._id, 'flow']);
      } else {
        this.ts.success('Saved ' + payload.name + '.');
        this.router.navigate(['/app', this.commonService.app._id, 'flow']);
      }
    }, (err: any) => {
      this.apiCalls.save = false;
      this.commonService.errorToast(err);
    });
  }

  save(deploy?: boolean) {
    const payload = this.getPayload();
    let request;
    this.apiCalls.save = true;
    this.saved = true
    if (this.edit.id) {
      request = this.commonService.put('partnerManager', `/${this.commonService.app._id}/${'flow'}/${this.edit.id}`, payload);
    } else {
      request = this.commonService.post('partnerManager', `/${this.commonService.app._id}/${'flow'}`, payload);
    }
    this.subscriptions['save'] = request.subscribe(res => {
      this.apiCalls.save = false;
      this.edit.status = false;
      if (deploy) {
        this.deploy();
      } else {
        this.ts.success('Saved ' + payload.name + '.');
        this.router.navigate(['/app', this.commonService.app._id, 'flow']);
      }
    }, err => {
      this.apiCalls.save = false;
      this.commonService.errorToast(err);
    });
  }

  deploy() {
    if (this.edit.id) {
      this.apiCalls.deploy = true;
      this.commonService.put('partnerManager', `/${this.commonService.app._id}/flow/utils/${this.edit.id}/deploy`, { app: this.commonService.app._id }).subscribe(res => {
        this.apiCalls.deploy = false;
        this.ts.success('Saved ' + this.flowData.name + ' and deployment process has started.');
        this.router.navigate(['/app', this.commonService.app._id, 'flow']);
        this.commonService.updateStatus(this.edit.id, 'flow');
        this.appService.getFlows();
      }, err => {
        this.apiCalls.deploy = false;
        this.commonService.errorToast(err);
      });
    }
  }

  cancel() {
    if (!this.edit.status || this.edit.editClicked || !this.edit.id) {
      this.router.navigate(['/app', this.commonService.app._id, 'flow']);
    } else {
      if (!this.edit.editClicked) {
        this.edit.status = false;
        this.getFlow(this.edit.id);
      }
    }
  }

  testRun() {
    this.apiCalls.testRun = true;
    this.commonService.put('partnerManager', `/${this.commonService.app._id}/flow/utils/${this.edit.id}/test`, {
      code: this.flowData.code,
      port: this.flowData.port
    }).subscribe(res => {
      this.apiCalls.testRun = false;
      this.ts.info('There are no syntax errors!');
    }, err => {
      this.apiCalls.testRun = false;
      this.commonService.errorToast(err);
    });
  }

  closeDeleteNodeModal(val: any) {
    if (val & val.data && val.data.nodeIndex > 0) {
      if (val.data.nodeIndex < this.flowData.nodes.length) {
        let prev
        if (val.data.nodeIndex > 1) {
          prev = this.flowData.nodes[val.data.nodeIndex - 2];
        } else {
          prev = this.flowData.inputNode;
        }
        const curr = this.flowData.nodes[val.data.nodeIndex - 1];
        const next = this.flowData.nodes[val.data.nodeIndex];
        const pt = prev.onSuccess.find(e => e._id == curr._id);
        pt._id = next._id;
      }
      this.flowData.nodes.splice(val.data.nodeIndex - 1, 1);
    }
  }

  canDeactivate(): Promise<boolean> | boolean {
    const self = this;
    if (this.changesDone && !this.saved) {
      return new Promise((resolve, reject) => {
        self.pageChangeModalTemplateRef = this.commonService.modal(this.pageChangeModalTemplate);
        self.pageChangeModalTemplateRef.result.then(close => {
          resolve(close);
        }, dismiss => {
          resolve(false);
        });
      });
    }
    return true;
  }

  addNode(event: any, type: string, anotherInputNode: boolean = false) {
    if (type) {

      const tempNode = this.flowService.getNodeObject(type, this.nodeList, anotherInputNode);
      tempNode.coordinates = {};
      const ele: HTMLElement = document.querySelectorAll('.flow-designer-svg')[0] as HTMLElement;
      const rect = ele.getBoundingClientRect();
      tempNode.coordinates.x = Number(this.contextMenuStyle.left.replace('px', '')) - rect.left - 70;
      tempNode.coordinates.y = Number(this.contextMenuStyle.top.replace('px', '')) - rect.top - 18;
      this.contextMenuStyle = null;
      this.nodeList.push(tempNode);
    }
  }

  addNodeToCanvas(type: string) {
    const temp = this.nodeList[this.nodeList.length - 1];
    const event = { pageX: temp.coordinates.x + 400, pageY: temp.coordinates.y + 200 };
    this.addNode(event, type);
  }

  onRightClick(event: PointerEvent) {
    event.preventDefault();
    const clientHeight = (event.target as HTMLElement).clientHeight;
    if (clientHeight > 330 && (event.clientY + 330) > clientHeight) {
      this.contextMenuStyle = { top: (event.clientY - 330) + 'px', left: event.clientX + 'px' };
    } else {
      this.contextMenuStyle = { top: event.clientY + 'px', left: event.clientX + 'px' };
    }
  }

  scroll() {
    this.contextMenuStyle = null
  }
  closeProperties() {
    this.showNodeProperties = false;
    this.showPathProperties = false;
    this.flowService.reCreatePaths.emit(null);
    this.flowService.selectedNode.emit(null);
  }


  // @HostListener('document:keydown', ['$event'])
  // onDeleteKey(event: any) {
  //   if ((((event.metaKey || event.ctrlKey) && event.key == 'Backspace') || event.key == 'Delete') && this.selectedNode) {
  //     this.nodeList.forEach((node: any) => {
  //       if (this.selectedNode.prevNode && node._id == this.selectedNode.prevNode._id) {
  //         let tempIndex = node.onSuccess.findIndex(e => e._id == this.selectedNode.currNode._id);
  //         node.onSuccess.splice(tempIndex, 1);
  //       }
  //     });
  //     let index = this.nodeList.findIndex(e => e._id == this.selectedNode.currNode._id);
  //     if (this.flowData.inputNode._id != this.selectedNode.currNode._id) {
  //       this.nodeList.splice(index, 1);
  //       this.flowService.reCreatePaths.emit(null);
  //       this.flowService.selectedNode.emit(null);
  //     }
  //   }
  // }

  // deleteNode(event) {
  //   console.log("what is this")
  //   if ((((event.metaKey || event.ctrlKey) && event.key == 'Backspace') || event.key == 'Delete') && this.selectedNode) {
  //     this.nodeList.forEach((node: any) => {
  //       if (this.selectedNode.prevNode && node._id == this.selectedNode.prevNode._id) {
  //         let tempIndex = node.onSuccess.findIndex(e => e._id == this.selectedNode.currNode._id);
  //         node.onSuccess.splice(tempIndex, 1);
  //       }
  //     });
  //     let index = this.nodeList.findIndex(e => e._id == this.selectedNode.currNode._id);
  //     if (this.flowData.inputNode._id != this.selectedNode.currNode._id) {
  //       this.nodeList.splice(index, 1);
  //       this.flowService.reCreatePaths.emit(null);
  //       this.flowService.selectedNode.emit(null);
  //     }
  //   }
  // }


  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: any) {
    this.isMouseDown = event;
    event.stopPropagation();
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: any) {
    if (this.isMouseDown) {
      let targetEle = (this.isMouseDown.target as HTMLElement);
      let currNode = this.nodeList.find(e => e._id == targetEle.dataset.id);
      if (currNode) {
        currNode.coordinates.x = Math.max(Math.floor(currNode.coordinates.x / 20) * 20, 0);
        currNode.coordinates.y = Math.max(Math.floor(currNode.coordinates.y / 20) * 20, 0);
        delete currNode.coordinates.clientX;
        delete currNode.coordinates.clientY;
        this.flowService.reCreatePaths.emit();
      }
    }
    this.isMouseDown = null;
    event.stopPropagation();
    // this.flowService.anchorSelected = null;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: any) {
    // event.stopPropagation();
    if (this.isMouseDown) {
      let targetEle = (this.isMouseDown.target as HTMLElement);
      // console.log(targetEle);
      let currNode = this.nodeList.find(e => e._id == targetEle.dataset.id);
      if (currNode) {
        let clientX = parseInt(currNode.coordinates.clientX || this.isMouseDown.clientX + '');
        let clientY = parseInt(currNode.coordinates.clientY || this.isMouseDown.clientY + '');
        const tempX = event.clientX - clientX;
        const tempY = event.clientY - clientY;
        // console.log(tempX, tempY);
        if (Math.abs(tempX) > 20 || Math.abs(tempY) > 20) {
          // this.isMouseDown = event;
          currNode.coordinates.clientX = event.clientX;
          currNode.coordinates.clientY = event.clientY;
          currNode.coordinates.x += tempX;
          currNode.coordinates.y += tempY;
        }
        this.flowService.reCreatePaths.emit();
      }
    }
  }

  evaluateCondition(condition: string): boolean {
    if (!condition) {
      return true
    }
    return eval(condition);
  }

  get hasErrorNode() {
    return this.flowService.nodeList.some(e => e.type == 'ERROR');
  }

  get apiCallsPending() {
    return Object.values(this.apiCalls).some(e => e);
  }

  get isValidSchema() {
    if (this.totalErrors > 0) {
      return false
    }
    const fileNodes = this.nodeList.filter(node => node.type == 'FILE');
    const checkAgent = (node) => {
      return node?.options?.agents?.length > 0
    }
    const checkUniqTxnId = (node) => {
      if (node?.options?.uniqueRemoteTransaction) {
        return node?.options?.uniqueRemoteTransactionOptions?.filename || node?.options?.uniqueRemoteTransactionOptions?.checksum
      }
      return true
    }
    if (fileNodes.length > 0) {
      return fileNodes.every(checkAgent) && fileNodes.every(checkUniqTxnId)
    }
    return true
  }

  get namespace() {
    if (this.flowData && this.flowData.namespace) {
      return this.flowData.namespace.split('-')[0];
    }
    return '-';
  }

  get fqdn() {
    if (this.commonService.userDetails && this.commonService.userDetails.fqdn) {
      return this.commonService.userDetails.fqdn;
    }
    return '-';
  }

  get hasDeployPermission() {
    return this.commonService.hasPermission('PMIFPD')
  }

  get hasManagePermission() {
    return this.commonService.hasPermission('PMIF')
  }

  getNodeError(id) {
    const errors = this.getErrors().filter(obj => obj.id === id);
    return errors;
  }

  getErrors() {
    const validations = this.flowService.getErrorValidations();

    const finalList = this.nodeList.reduce((acc, node) => {
      const nodeValidations = (validations.find(e => {
        return e.node === node.type
      }) || {}).validations || [];

      const errors = nodeValidations
        .map(item => {
          if (item['subType']) {
            if (item['subType'] === (node.options.connectorType) || node.options[item['subType'].toLowerCase()])
              return this.checkErrors(item, node);
            else {
              return null
            }
          }
          else {
            return this.checkErrors(item, node)
          }
        })
        .filter(Boolean);

      if (errors.length) acc.push(errors);

      return acc;
    }, []);
    return finalList.flat()
  }

  getWarnings() {
    const validations = [{
      fieldPath: 'dataStructure.incoming',
      type: 'required',
      warning: "Input Data Structure should't be generic",
    },
    {
      fieldPath: 'dataStructure.outgoing',
      type: 'required',
      warning: "Output Data Structure should't be generic",
    }]

    const finalList = this.nodeList.reduce((acc, node) => {
      let warnValidations = _.cloneDeep(validations)
      if (this.flowService.showOutputSelector(node, this.isInputNode(node))) {
        warnValidations = warnValidations.filter(ele => ele.fieldPath === 'dataStructure.outgoing')
      }
      if (this.flowService.showInputSelector(node, this.isInputNode(node))) {
        warnValidations = warnValidations.filter(ele => ele.fieldPath === 'dataStructure.incoming')
      }
      if (!this.flowService.showOutputSelector(node, this.isInputNode(node)) && !this.flowService.showInputSelector(node, this.isInputNode(node))) {
        warnValidations = []
      }
      const warnings = warnValidations
        .map(item => {
          const value = item.fieldPath.split('.').reduce((obj, key) => obj?.[key], node);
          if (item.type === 'required' && (!value || _.isEmpty(value))) {
            return {
              node: node.name,
              id: node._id,
              warning: item.warning
            };
          }
          return null;
        })
        .filter(Boolean);

      if (warnings.length) acc.push(warnings);

      return acc;
    }, []);
    return finalList.flat()
  }

  checkErrors(item, node) {
    if (item.condition && Object.getOwnPropertyNames(item.condition).includes('inputNode')) {
      const isInputNode = this.isInputNode(node);
      if (item.condition.inputNode !== isInputNode) {
        return null;
      }
    }
    const value = item.fieldPath.split('.').reduce((obj, key) => obj?.[key], node)
    if (item.type === 'required' && (!value || value.length < 1)) {
      return {
        node: node.name,
        id: node._id,
        error: item.error
      };
    }
    return null;
  }

  getAccumulatedObj(type) {
    const result = [];
    const data = type === 'error' ? this.getErrors() : this.getWarnings();

    data.forEach(obj => {
      const { node, [type]: groupValue } = obj;
      const existingNode = result.find(item => item.node === node);

      if (existingNode) {
        existingNode[type].push({ [type]: groupValue });
      } else {
        result.push({ node, [type]: [{ [type]: groupValue }] });
      }
    });

    return result;
  }
  isInputNode(node) {
    if (this.flowData && node) {
      return this.flowData.inputNode._id == node._id;
    }
    return true;
    // return this.nodeList[0]._id == this.currNode._id;
  }

  get totalErrors() {
    return this.getErrors().length;
  }

  get totalWarnings() {
    return this.getWarnings().length;
  }


}
