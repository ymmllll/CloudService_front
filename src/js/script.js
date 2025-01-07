function showPage(pageId) {
  event.preventDefault();
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if(pageId==="vlanDivision"){
    loadVlanData();
  }
}

// 获取虚拟机信息
async function loadVMData() {
  const vmLoading = document.getElementById("vmLoading");
  const vmTable = document.getElementById("vmTable");
  const tbody = vmTable.querySelector("tbody");

  const vmTable2 = document.getElementById("vmTable2");
  const tbody2 = vmTable2.querySelector("tbody");

  try {
    // 请求后端 API
    const response = await fetch("http://192.168.119.129:8080/domains?url=qemu:///system");
    const vmData = await response.json();

    // 隐藏加载提示
    vmLoading.style.display = "none";
    vmTable.style.display = "table";
    vmTable2.style.display = "table";
    // 填充表格数据
    tbody.innerHTML = ""; // 清空现有内容
    tbody2.innerHTML="";

    vmData.forEach(vm => {
      const row = document.createElement("tr");

      // 单选按钮
      const radioCell = document.createElement("td");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "vmSelect";
      radio.value = vm.id;
      radioCell.appendChild(radio);
      row.appendChild(radioCell);

      // 虚拟机名称
      const nameCell = document.createElement("td");
      nameCell.textContent = vm.name;
      row.appendChild(nameCell);

      // 虚拟机状态
      const statusCell = document.createElement("td");
      statusCell.textContent = vm.status;
      row.appendChild(statusCell);

      // 生成快照按钮
      const snapshotButtonCell = document.createElement("td");
      const snapshotButton = document.createElement("button");
      snapshotButton.textContent = "生成快照";
      snapshotButton.classList.add("snapshot-button");
      snapshotButton.addEventListener("click", () => createSnapshot(vm.id, vm.name)); // 给按钮绑定点击事件
      snapshotButtonCell.appendChild(snapshotButton);
      row.appendChild(snapshotButtonCell);

      // 查看快照按钮
      const viewSnapshotButtonCell = document.createElement("td");
      const viewSnapshotButton = document.createElement("button");
      viewSnapshotButton.textContent = "查看快照";
      viewSnapshotButton.classList.add("view-snapshot-button");
      viewSnapshotButton.addEventListener("click", () => viewSnapshot(vm.id, vm.name)); // 给按钮绑定点击事件
      viewSnapshotButtonCell.appendChild(viewSnapshotButton);
      row.appendChild(viewSnapshotButtonCell);

      tbody.appendChild(row);

      const row2 = document.createElement("tr");
      // 虚拟机名称
      const nameCell2 = document.createElement("td");
      nameCell2.textContent = vm.name;
      row2.appendChild(nameCell2);

      //多选框
      const checkboxCell2 = document.createElement("td");
      const checkbox2 = document.createElement("input");
      checkbox2.type = "checkbox";  // 修改为 checkbox
      checkbox2.value = vm.name;      // 每个复选框的值仍然是虚拟机的 ID
      checkboxCell2.appendChild(checkbox2);
      row2.appendChild(checkboxCell2);

      tbody2.appendChild(row2);

    });
  } catch (error) {
    console.error("获取虚拟机数据失败:", error);
    vmLoading.textContent = "加载虚拟机信息失败，请检查网络或后端服务。";
  }
}

async function loadVlanData(){
  const vlantable=document.getElementById("vlanTable");
  const tbody=vlantable.querySelector("tbody");
  const url="qemu:///system";
  try{
    const response=await fetch(`http://192.168.122.1:8080/listVlans?url=qemu:///system`);
    const vlandatas=await response.json();
    //console.log(vlandatas);

    vlantable.style.display="table";
    tbody.innerHTML="";

    vlandatas.forEach(vlandata=>{
      vlandata.domains.forEach(domain=>{
        const row=document.createElement("tr");

        const vlanNameCell=document.createElement("td");
        vlanNameCell.textContent=vlandata.name;
        row.appendChild(vlanNameCell);

        const nameCell=document.createElement("td");
        nameCell.textContent=domain.name;
        row.appendChild(nameCell);

        const deleteButtonCell=document.createElement("td");
        const deleteButton =document.createElement("button");
        deleteButton.textContent="删除";
        deleteButton.addEventListener("click", ()=>delete_single_vlan("http://192.168.119.129:8080/removeVlanInterface",domain.name,vlandata.name));
        deleteButtonCell.appendChild(deleteButton);
        row.appendChild(deleteButtonCell);

        tbody.appendChild(row);
      })
    })
  }catch(error){
    console.log(error);
  }
}

async function changeVm(baseurl,name){
  try {
    // 请求后端 API
    const url="qemu:///system";
    const params = new URLSearchParams({ url: url, name: name});
    const response =await fetch(`${baseurl}?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();  // 解析 JSON
      console.log(data);  // 处理数据
    } else {
      handleError(response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("请求失败", error);
  }
}

function handleError(status) {
  switch (status) {
    case 400:
      console.log("Bad Request (400)");
      break;
    case 401:
      console.log("Unauthorized (401)");
      break;
    case 403:
      console.log("Forbidden (403)");
      break;
    case 404:
      console.log("Not Found (404)");
      break;
    case 500:
      alert("虚拟机未开启，无法关闭。");
      break;
    case 503:
      console.log("Service Unavailable (503)");
      break;
    default:
      console.log(`未知错误，状态码: ${status}`);
  }
}

// 获取选中的虚拟机
function getSelectedVM() {
  const selectedRadio = document.querySelector('input[name="vmSelect"]:checked');
  if (!selectedRadio) {
    alert("请选择一个虚拟机!");
    return null;
  }

  const selectedVMId = selectedRadio.value;
  const selectedVMName = selectedRadio.closest('tr').querySelector('td:nth-child(2)').textContent; // 获取虚拟机名称

  return { id: selectedVMId, name: selectedVMName };
}

function getSelectedVMs() {
  // 获取所有选中的复选框
  const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');

  // 如果没有选中的复选框，返回一个提示信息
  if (selectedCheckboxes.length === 0) {
    alert("请选择至少一个虚拟机！");
    return [];
  }

  // 提取所有选中的复选框的值
  const selectedVMIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
  return selectedVMIds;
}


// 执行不同的操作
function performAction(action) {
  const selectedVM = getSelectedVM();
  if (!selectedVM) return; // 如果没有选中虚拟机，直接返回

  const { id, name } = selectedVM;

  switch (action) {
    case 'start':
      console.log(`启动虚拟机：${name} (ID: ${id})`);
      changeVm("http://192.168.142.131:8080/start",name);
      alert(`虚拟机 ${name} 已启动`);
      break;
    case 'stop':
      console.log(`停止虚拟机：${name} (ID: ${id})`);
      changeVm("http://192.168.142.131:8080/shutdown",name);
      alert(`虚拟机 ${name} 已停止`);
      break;
    case 'restart':
      console.log(`重启虚拟机：${name} (ID: ${id})`);
      changeVm("http://192.168.142.131:8080/reboot",name);
      alert(`虚拟机 ${name} 已重启`);
      break;
    case 'hangup':
      console.log(`挂起虚拟机：${name}(ID:${id}`);
      changeVm("http://192.168.142.131:8080/suspend",name);
      alert(`虚拟机 ${name} 已挂起`);
      break;
    case 'recovery':
      console.log(`恢复虚拟机：${name}(ID:${id}`);
      changeVm("http://192.168.142.131:8080/resume",name);
      alert(`虚拟机 ${name} 已恢复`);
      break;
    default:
      console.error('未知操作:', action);
  }
  loadVMData();
}

function performAction2(action){
  switch (action) {
    case 'create_vlan':
      createVlan();
      break;
    default:
      console.error("未知操作：",action);
  }
}

function createSnapshot(vmId, vmName) {
  // 显示模态框
  const modal = document.getElementById("snapshotModal");
  modal.style.display = "block";
  // 关闭模态框
  const closeBtn = modal.querySelector(".close");
  closeBtn.onclick = () => {
    modal.style.display = "none";
  };
  // 发送按钮逻辑
  sendButton = document.getElementById("sendSnapshotButton");
  sendButton.onclick = () => {
    const snapshotName = document.getElementById("snapshotName").value;
    if (snapshotName.trim() === "") {
      alert("快照名称不能为空！");
      return;
    }
    performSnapshot("http://192.168.142.131:8080/snapshotCurrent",vmName,snapshotName);
    alert(`生成快照: ${snapshotName} (虚拟机：${vmName} ID: ${vmId})`);
    modal.style.display = "none"; // 关闭模态框
  };
}

function recoverySnapshot(id,name,snapName){
  performSnapshot(`http://192.168.142.131:8080/revertToSnapshot`,name,snapName);
  alert(`恢复快照: ${snapName} (虚拟机：${name} ID: ${id})`);
}

function deleteSnapshot(id,name,snapName){
  const url="qemu:///system";
  const paras=new URLSearchParams({url:url,name:name,snapName:snapName})
  performSnapshot(`http://192.168.142.131:8080/snapshot-delete`,name,snapName);
  alert(`删除快照: ${snapName} (虚拟机：${name} ID: ${id})`);
  viewSnapshot(id,name);
}

async function viewSnapshot(vmId, vmName) {
  // 显示模态框
  const modal = document.getElementById("snapshotModal2");
  modal.style.display = "block";
  // 关闭模态框
  const closeBtn = modal.querySelector(".close");
  closeBtn.onclick = () => {
    modal.style.display = "none";
  };

  const snapTable = document.getElementById("snaptable");
  const tbody = snapTable.querySelector("tbody");
  try {
    // 请求后端 API
    const url="qemu:///system";
    const params = new URLSearchParams({ url: url, name: vmName});
    const response = await fetch(`http://192.168.142.131:8080/snapshot-list?${params.toString()}`);
    const vmData = await response.json();
    snapTable.style.display = "table";

    // 填充表格数据
    tbody.innerHTML = ""; // 清空现有内容
    vmData.forEach(vm => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");

      nameCell.textContent = vm;
      row.appendChild(nameCell);

      // 生成快照按钮
      const snapshotButtonCell = document.createElement("td");
      const snapshotButton = document.createElement("button");
      snapshotButton.textContent = "恢复快照";
      snapshotButton.classList.add("recovery-snapshot-button");
      snapshotButton.addEventListener("click", () => recoverySnapshot(vmId, vmName,vm)); // 给按钮绑定点击事件
      snapshotButtonCell.appendChild(snapshotButton);
      row.appendChild(snapshotButtonCell);

      // 查看快照按钮
      const viewSnapshotButtonCell = document.createElement("td");
      const viewSnapshotButton = document.createElement("button");
      viewSnapshotButton.textContent = "删除快照";
      viewSnapshotButton.classList.add("delete-snapshot-button");
      viewSnapshotButton.addEventListener("click", () => deleteSnapshot(vmId, vmName,vm)); // 给按钮绑定点击事件
      viewSnapshotButtonCell.appendChild(viewSnapshotButton);
      row.appendChild(viewSnapshotButtonCell);

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("获取虚拟机数据失败:", error);
    vmLoading.textContent = "加载虚拟机信息失败，请检查网络或后端服务。";
  }
}

async function performSnapshot(baseurl,name,snapName){
  try {
    // 请求后端 API
    const url="qemu:///system";
    const params = new URLSearchParams({ url: url, name: name,snapName:snapName});
    const response =await fetch(`${baseurl}?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();  // 解析 JSON
      console.log(data);  // 处理数据
    } else {
      handleError(response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("请求失败", error);
  }
}

function createVlan() {
  // 显示模态框
  const modal = document.getElementById("createvlanModal");
  modal.style.display = "block";

  // 关闭模态框
  const closeBtn = modal.querySelector(".close");
  closeBtn.onclick = () => {
    modal.style.display = "none";
  };
  // 发送按钮逻辑
  sendButton = document.getElementById("createVlanButton");
  sendButton.onclick = () => {
    const vmnames=getSelectedVMs();
    const vlanId = document.getElementById("vlanId").value;
    if (vlanId.trim() === "") {
      alert("VLAN的id不能为空！");
      return;
    }
    vmnames.forEach(vmname=>{
      create_single_vlan("http://192.168.119.129:8080/addVlanInterface",vmname,vlanId);
    })
    alert(`创建VLAN: ${vlanId} (虚拟机：${vmnames} ID: ${vlanId})`);
    loadVlanData();
    modal.style.display = "none"; // 关闭模态框
  };
}

function create_single_vlan(baseurl,vmname,vlanId){
  fetch(baseurl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url:'qemu:///system',
      name: vmname,
      vlanId: vlanId
    })
  })
    .then(response => response.json())
    .then(data => console.log(data));
}

function delete_single_vlan(baseurl,vmname,vlanName){
  fetch(baseurl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url:'qemu:///system',
      name: vmname,
      networkName: vlanName
    })
  })
    .then(response => response.json())
    .then(data => console.log(data));
  alert(`删除VLAN:(VLAN名称：${vlanName} ,虚拟机名称： ${vmname})`);
  loadVlanData();
}

// 加载虚拟机数据时触发
document.addEventListener("DOMContentLoaded", loadVMData);
